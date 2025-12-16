import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum file size: 10GB
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;

// Helper function to create SHA256 hash
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to create HMAC-SHA256
async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

// URL-safe encode for path segments
function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment)
    .replace(/%2F/g, '/')
    .replace(/\!/g, '%21')
    .replace(/\'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

// Generate AWS Signature V4 Presigned URL for R2
async function generatePresignedUrl(
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  contentType: string,
  endpoint: string,
  expiresIn: number = 3600
): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  
  // Parse endpoint to get host
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.host}`;
  
  // Create canonical request
  const method = 'PUT';
  
  // Properly encode the key for the URL path
  const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const canonicalUri = `/${encodedKey}`;
  
  // Include content-type in signed headers for PUT requests
  const signedHeaders = 'content-type;host';
  
  const queryParams: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', expiresIn.toString()],
    ['X-Amz-SignedHeaders', signedHeaders],
  ];
  
  // Sort query parameters
  queryParams.sort((a, b) => a[0].localeCompare(b[0]));
  const canonicalQueryString = queryParams
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  // Headers must be in alphabetical order and lowercase
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const payloadHash = 'UNSIGNED-PAYLOAD';
  
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  console.log('Canonical Request:', canonicalRequest);
  
  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const hashedCanonicalRequest = await sha256(canonicalRequest);
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');
  
  // Calculate signature
  const encoder = new TextEncoder();
  const kSecret = encoder.encode(`AWS4${secretAccessKey}`);
  const kDate = await hmacSha256(kSecret.buffer as ArrayBuffer, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signatureBytes = await hmacSha256(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Build presigned URL
  const presignedUrl = `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  
  console.log('Generated Presigned URL (length):', presignedUrl.length);
  
  return presignedUrl;
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
      console.error('Missing R2 configuration', {
        hasAccessKey: !!R2_ACCESS_KEY_ID,
        hasSecretKey: !!R2_SECRET_ACCESS_KEY,
        hasBucket: !!R2_BUCKET_NAME,
        hasEndpoint: !!R2_ENDPOINT,
        hasPublicUrl: !!R2_PUBLIC_URL
      });
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
      // Sanitize filename - remove special characters but keep extensions
      const sanitizedFileName = fileName
        .replace(/[^a-zA-Z0-9._\-\/]/g, '_')
        .replace(/_+/g, '_');
      
      // Prefix filename with userId to ensure user can only upload to their own folder
      const secureFileName = `${userId}/${sanitizedFileName}`;
      
      console.log(`Generating presigned URL for file: ${secureFileName}`);
      
      const presignedUrl = await generatePresignedUrl(
        R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME,
        secureFileName,
        contentType,
        R2_ENDPOINT,
        3600 // 1 hour expiry
      );
      
      const publicUrl = `${R2_PUBLIC_URL}/${secureFileName}`;

      console.log(`Generated presigned URL for: ${secureFileName}`);

      return new Response(
        JSON.stringify({ 
          presignedUrl, 
          publicUrl,
          fileName: secureFileName,
          contentType: contentType // Return the content type that was signed
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Verify user owns the file
      const fileUserId = fileName.split('/')[0];
      if (fileUserId !== userId) {
        console.error(`User ${userId} attempted to delete file owned by ${fileUserId}`);
        return new Response(
          JSON.stringify({ error: 'Forbidden: You can only delete your own files' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
