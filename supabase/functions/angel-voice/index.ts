import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    console.log('🎤 Generating Angel voice for:', text.substring(0, 50))

    // Use OpenAI TTS with "nova" voice - friendly and youthful
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova', // Nova is a friendly, warm female voice
        speed: 1.15, // Slightly faster for cute baby-like effect
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI TTS error:', error)
      throw new Error(error.error?.message || 'Failed to generate speech')
    }

    console.log('✅ Angel voice generated successfully')

    // Return audio directly as binary
    const audioBuffer = await response.arrayBuffer()
    
    return new Response(audioBuffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error) {
    console.error('Angel voice error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate voice'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
