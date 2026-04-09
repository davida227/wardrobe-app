import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { ClothingItem } from '@/lib/types';

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { items, occasion } = await request.json() as { items: ClothingItem[]; occasion?: string };
    if (!items?.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 });

    const itemList = items.map(i =>
      `- ID:${i.id} | ${i.name} | ${i.category} | ${i.color} | ${i.formality} | Seasons: ${i.seasons?.join(', ')}`
    ).join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a personal stylist. Based on this wardrobe, suggest 4 complete outfits${occasion ? ` for: ${occasion}` : ''}.

WARDROBE:
${itemList}

Return a JSON array of outfit objects, each with:
- name: creative outfit name
- description: 1-2 sentence description of the look
- occasion: best occasion for this outfit
- styling_tips: one practical styling tip
- item_ids: array of item IDs from the wardrobe to include

Return ONLY valid JSON array, no markdown or explanation.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const outfits = JSON.parse(text);
    return NextResponse.json({ outfits });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
