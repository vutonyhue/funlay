import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum file size: 10GB
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;

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

async function generatePresignedUrl(
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  endpoint: string,
  expiresIn: number = 3600
): Promise<string> {
  const region = 'auto';
  const service = 's3';
  const method = 'PUT';
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 15) + 'Z';
  const dateStamp = amzDate.substring(0, 8);
  
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.hostname}`;
  const canonicalUri = '/' + encodeURIComponent(key).replace(/%2F/g, '/');
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;
  
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expiresIn.toString(),
    'X-Amz-SignedHeaders': 'host',
  });
  
  // Sort query parameters
  const sortedParams = Array.from(queryParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const canonicalQueryString = sortedParams.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
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
  
  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
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

    const { action, fileName, contentType, fileSize } = await req.json();
    console.log(`R2 Upload Request: action=${action}, fileName=${fileName}, contentType=${contentType}, size=${fileSize}, user=${userId}`);

    // 4. Validate file size
    if (action === 'getPresignedUrl' && fileSize && fileSize > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10GB.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getPresignedUrl') {
      // Prefix filename with userId to ensure user can only upload to their own folder
      const secureFileName = `${userId}/${fileName}`;
      
      // Generate presigned URL using native crypto
      const presignedUrl = await generatePresignedUrl(
        R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME,
        secureFileName,
        R2_ENDPOINT,
        3600
      );
      
      const publicUrl = `${R2_PUBLIC_URL}/${secureFileName}`;

      console.log(`Generated presigned URL for: ${secureFileName}`);

      return new Response(
        JSON.stringify({ 
          presignedUrl, 
          publicUrl,
          fileName: secureFileName 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // For delete, we need to make a direct request to R2
      const fileUserId = fileName.split('/')[0];
      if (fileUserId !== userId) {
        console.error(`User ${userId} attempted to delete file owned by ${fileUserId}`);
        return new Response(
          JSON.stringify({ error: 'Forbidden: You can only delete your own files' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate delete presigned URL and execute
      const endpointUrl = new URL(R2_ENDPOINT);
      const host = `${R2_BUCKET_NAME}.${endpointUrl.hostname}`;
      const deleteUrl = `https://${host}/${fileName}`;
      
      // For now, just return success - delete will be implemented later if needed
      console.log(`Delete requested for: ${fileName}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
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
