import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    // Strip data URL prefix to get raw base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
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
              text: `Analyze this clothing item and return a JSON object with these fields:
- name: short descriptive name (e.g. "White Oxford Shirt", "Black Slim Jeans")
- category: one of Tops, Bottoms, Outerwear, Shoes, Accessories, Dresses, Activewear, Formal
- color: primary color(s) as a short string
- pattern: e.g. Solid, Striped, Plaid, Floral, Graphic, etc.
- fabric: best guess at material, e.g. Cotton, Denim, Wool, Leather, Polyester
- formality: one of Casual, Smart Casual, Business Casual, Business Formal, Formal
- seasons: array of applicable seasons from ["Spring", "Summer", "Fall", "Winter", "All Season"]
- notes: one sentence of useful styling notes

Return ONLY valid JSON, no markdown or explanation.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const analysis = JSON.parse(text);
    return NextResponse.json(analysis);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
