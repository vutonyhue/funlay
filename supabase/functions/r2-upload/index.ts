import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum file size: 500MB for proxy upload
const MAX_PROXY_SIZE = 500 * 1024 * 1024;

// Helper function to create HMAC-SHA256 signature
async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return kSigning;
}

async function generateAuthHeaders(
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  endpoint: string,
  method: string,
  contentType: string,
  payloadHash: string
): Promise<{ headers: Record<string, string>, url: string }> {
  const region = 'auto';
  const service = 's3';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const dateStamp = amzDate.substring(0, 8);
  
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.hostname}`;
  const canonicalUri = '/' + encodeURIComponent(key).replace(/%2F/g, '/');
  const url = `https://${host}${canonicalUri}`;
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  
  const canonicalRequest = [
    method,
    canonicalUri,
    '', // empty query string
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const hashedCanonicalRequest = await sha256(canonicalRequest);
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    url,
    headers: {
      'Authorization': authorizationHeader,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Content-Type': contentType,
      'Host': host
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify the user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Authenticated user: ${userId}`);

    // 3. Get R2 configuration
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT');
    const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL');

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT || !R2_PUBLIC_URL) {
      console.error('Missing R2 configuration');
      return new Response(
        JSON.stringify({ error: 'R2 storage not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    
    // Check if this is a multipart form data upload (proxy upload)
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing proxy upload...');
      
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const fileName = formData.get('fileName') as string;
      
      if (!file || !fileName) {
        return new Response(
          JSON.stringify({ error: 'Missing file or fileName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (file.size > MAX_PROXY_SIZE) {
        return new Response(
          JSON.stringify({ error: 'File too large for proxy upload. Maximum 500MB.' }),
          { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const secureFileName = `${userId}/${fileName}`;
      const fileArrayBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileArrayBuffer);
      
      // Calculate payload hash
      const payloadHash = await sha256(new TextDecoder().decode(fileBytes));
      
      // For binary files, use UNSIGNED-PAYLOAD
      const { url, headers } = await generateAuthHeaders(
        R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME,
        secureFileName,
        R2_ENDPOINT,
        'PUT',
        file.type || 'application/octet-stream',
        'UNSIGNED-PAYLOAD'
      );
      
      console.log(`Uploading to R2: ${url}`);
      
      // Upload to R2
      const r2Response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...headers,
          'x-amz-content-sha256': 'UNSIGNED-PAYLOAD'
        },
        body: fileBytes
      });
      
      if (!r2Response.ok) {
        const errorText = await r2Response.text();
        console.error('R2 upload failed:', r2Response.status, errorText);
        return new Response(
          JSON.stringify({ error: `R2 upload failed: ${r2Response.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const publicUrl = `${R2_PUBLIC_URL}/${secureFileName}`;
      console.log(`Upload successful: ${publicUrl}`);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          publicUrl,
          fileName: secureFileName 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // JSON request for presigned URL or delete
    const { action, fileName, contentType: fileContentType, fileSize } = await req.json();
    console.log(`R2 Request: action=${action}, fileName=${fileName}, contentType=${fileContentType}, size=${fileSize}, user=${userId}`);

    if (action === 'delete') {
      const fileUserId = fileName.split('/')[0];
      if (fileUserId !== userId) {
        console.error(`User ${userId} attempted to delete file owned by ${fileUserId}`);
        return new Response(
          JSON.stringify({ error: 'Forbidden: You can only delete your own files' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate delete request
      const { url, headers } = await generateAuthHeaders(
        R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME,
        fileName,
        R2_ENDPOINT,
        'DELETE',
        '',
        'UNSIGNED-PAYLOAD'
      );
      
      const deleteResponse = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...headers,
          'x-amz-content-sha256': 'UNSIGNED-PAYLOAD'
        }
      });
      
      console.log(`Delete response: ${deleteResponse.status}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use multipart form data for uploads.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('R2 Upload Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
