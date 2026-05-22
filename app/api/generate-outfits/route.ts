import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { ClothingItem } from '@/lib/types';

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { items, occasion, temperature, timeOfDay } = await request.json() as {
      items: ClothingItem[];
      occasion?: string;
      temperature?: string;
      timeOfDay?: string;
    };
    if (!items?.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 });

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

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a personal stylist. Based on this wardrobe, suggest 4 complete outfits.${context}

WARDROBE:
${itemList}

Return a JSON array of outfit objects, each with:
- name: creative outfit name
- description: 1-2 sentence description of the look
- occasion: best occasion for this outfit
- styling_tips: one practical styling tip relevant to the time of day, weather, and occasion
- item_ids: array of item IDs from the wardrobe to include

Return ONLY valid JSON array, no markdown or explanation.`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]';
    // Strip markdown code fences if the model wrapped the response (e.g. ```json ... ```)
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const outfits = JSON.parse(text);
    return NextResponse.json({ outfits });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
