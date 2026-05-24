import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Map UI model IDs to actual Anthropic model IDs expected by the backend
function getAnthropicModel(id: string): string {
  if (id === 'claude-sonnet-4-20250514') return 'claude-sonnet-4-6';
  if (id === 'claude-opus-4-20250514') return 'claude-opus-4-6';
  if (id === 'claude-haiku-4-5-20251001') return 'claude-haiku-4-5';
  return id;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageBase64 } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    // Fetch the user's preferred model
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferred_model')
      .eq('user_id', user.id)
      .maybeSingle();

    const selectedModel = profile?.preferred_model || 'claude-sonnet-4-20250514';
    const isGemini = selectedModel.startsWith('gemini');

    // Strip data URL prefix to get raw base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const promptText = `Analyze this clothing item and return a JSON object with these fields:
- name: short descriptive name (e.g. "White Oxford Shirt", "Black Slim Jeans")
- category: one of Tops, Bottoms, Outerwear, Shoes, Accessories, Dresses, Activewear, Formal
- color: primary color(s) as a short string
- pattern: e.g. Solid, Striped, Plaid, Floral, Graphic, etc.
- fabric: best guess at material, e.g. Cotton, Denim, Wool, Leather, Polyester
- formality: one of Casual, Smart Casual, Business Casual, Business Formal, Formal
- seasons: array of applicable seasons from ["Spring", "Summer", "Fall", "Winter", "All Season"]
- notes: one sentence of useful styling notes

Return ONLY valid JSON, no markdown or explanation.`;

    let textResponse = '';

    if (isGemini) {
      const googleAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await googleAi.models.generateContent({
        model: selectedModel,
        contents: [
          promptText,
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg'
            }
          }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });
      textResponse = response.text || '';
    } else {
      const anthropic = new Anthropic();
      const mappedModel = getAnthropicModel(selectedModel);
      const response = await anthropic.messages.create({
        model: mappedModel,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64Data },
              },
              {
                type: 'text',
                text: promptText,
              },
            ],
          },
        ],
      });
      textResponse = response.content[0].type === 'text' ? response.content[0].text : '';
    }

    // Strip markdown code fences if the model wrapped the response (e.g. ```json ... ```)
    const cleanedJson = textResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const analysis = JSON.parse(cleanedJson);
    return NextResponse.json(analysis);
  } catch (e: any) {
    console.error('Error in analyze-clothing route:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
