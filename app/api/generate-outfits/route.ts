import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { ClothingItem } from '@/lib/types';
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

    const { items, occasion, temperature, timeOfDay } = await request.json() as {
      items: ClothingItem[];
      occasion?: string;
      temperature?: string;
      timeOfDay?: string;
    };
    if (!items?.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 });

    // Fetch user profile (AI model choice + custom style details)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferred_model, style_notes, measurements')
      .eq('user_id', user.id)
      .maybeSingle();

    const selectedModel = profile?.preferred_model || 'claude-sonnet-4-20250514';
    const isGemini = selectedModel.startsWith('gemini');

    const itemList = items.map(i =>
      `- ID:${i.id} | ${i.name} | ${i.category} | ${i.color} | ${i.formality} | Seasons: ${i.seasons?.join(', ')}${i.occasions?.length ? ` | Good for: ${i.occasions.join(', ')}` : ''}`
    ).join('\n');

    // Build a context string from the optional filters
    const contextParts: string[] = [];
    if (occasion) contextParts.push(`Occasion: ${occasion}`);
    if (timeOfDay) contextParts.push(`Time of day: ${timeOfDay}`);
    if (temperature) contextParts.push(`Temperature: ${temperature}`);

    const context = contextParts.length
      ? `\n\nCONTEXT:\n${contextParts.join('\n')}\n\nTailor the outfits to suit this context — factor in the time of day (e.g. morning calls for practical and put-together looks, evening skews more dressed-up or relaxed depending on occasion), weather-appropriate layering, fabric weight, and the formality level of the occasion.`
      : '';

    // Inject personal style details to make recommendations extremely premium and personalized
    let styleContext = '';
    if (profile?.style_notes) {
      styleContext += `\n\nUSER STYLE PREFERENCES & FIT DETAILS:\n${profile.style_notes}\n`;
    }
    if (profile?.measurements && Object.keys(profile.measurements).length > 0) {
      const measurementLines = Object.entries(profile.measurements)
        .filter(([_, val]) => !!val)
        .map(([key, val]) => `- ${key}: ${val}`)
        .join('\n');
      if (measurementLines) {
        styleContext += `\n\nUSER BODY MEASUREMENTS (Use these to suggest well-proportioned silhouettes and fits):\n${measurementLines}\n`;
      }
    }

    const promptText = `You are a personal stylist. Based on this wardrobe, suggest 4 complete outfits.${context}${styleContext}

WARDROBE:
${itemList}

Return a JSON array of outfit objects, each with:
- name: creative outfit name
- description: 1-2 sentence description of the look
- occasion: best occasion for this outfit
- styling_tips: one practical styling tip relevant to the time of day, weather, and occasion
- item_ids: array of item IDs from the wardrobe to include

Return ONLY valid JSON array, no markdown or explanation.`;

    let textResponse = '';

    if (isGemini) {
      const googleAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await googleAi.models.generateContent({
        model: selectedModel,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        }
      });
      textResponse = response.text || '[]';
    } else {
      const anthropic = new Anthropic();
      const mappedModel = getAnthropicModel(selectedModel);
      const response = await anthropic.messages.create({
        model: mappedModel,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: promptText,
          },
        ],
      });
      textResponse = response.content[0].type === 'text' ? response.content[0].text : '[]';
    }

    // Strip markdown code fences if the model wrapped the response (e.g. ```json ... ```)
    const cleanedJson = textResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let outfits = JSON.parse(cleanedJson);

    // Defensive mapping in case Gemini or Claude wraps the array in an object (e.g. { "outfits": [...] } or { "suggestions": [...] })
    if (!Array.isArray(outfits)) {
      if (outfits.outfits && Array.isArray(outfits.outfits)) {
        outfits = outfits.outfits;
      } else if (outfits.suggestions && Array.isArray(outfits.suggestions)) {
        outfits = outfits.suggestions;
      } else {
        // Fallback to converting object to array or empty array
        outfits = [];
      }
    }

    return NextResponse.json({ outfits });
  } catch (e: any) {
    console.error('Error in generate-outfits route:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
