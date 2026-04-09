'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import AppShell from '@/components/AppShell';
import { ClothingItem, SavedOutfit, OCCASIONS } from '@/lib/types';

type GeneratedOutfit = {
  name: string;
  description: string;
  occasion: string;
  styling_tips: string;
  item_ids: string[];
};

export default function OutfitsPage() {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [generated, setGenerated] = useState<GeneratedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [occasion, setOccasion] = useState('');
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [{ data: clothing }, { data: outfits }] = await Promise.all([
      supabase.from('clothing_items').select('*'),
      supabase.from('saved_outfits').select('*').order('created_at', { ascending: false }),
    ]);

    setWardrobeItems(clothing ?? []);
    setSavedOutfits(outfits ?? []);
    setLoading(false);
  };

  const generate = async () => {
    if (!wardrobeItems.length) return;
    setGenerating(true);
    setError('');
    setGenerated([]);
    try {
      const res = await fetch('/api/generate-outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: wardrobeItems, occasion: occasion || undefined }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGenerated(data.outfits);
    } catch (e: any) {
      setError('Generation failed: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveOutfit = async (outfit: GeneratedOutfit, index: number) => {
    setSavingId(index);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('saved_outfits').insert({
        user_id: user.id,
        name: outfit.name,
        description: outfit.description,
        occasion: outfit.occasion,
        styling_tips: outfit.styling_tips,
        item_ids: outfit.item_ids,
      });
      await load();
    } finally {
      setSavingId(null);
    }
  };

  const itemMap = Object.fromEntries(wardrobeItems.map(i => [i.id, i]));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Outfit Suggestions</h2>

          {wardrobeItems.length < 3 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
              <div className="text-4xl mb-2">👗</div>
              <p className="font-medium text-gray-600">Add more clothes first</p>
              <p className="text-sm mt-1">You need at least 3 items for outfit suggestions</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <select value={occasion} onChange={e => setOccasion(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="">Any occasion</option>
                {OCCASIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              <button onClick={generate} disabled={generating}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap">
                {generating ? '✨ Generating...' : '✨ Generate'}
              </button>
            </div>
          )}

          {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        </div>

        {/* Generated outfits */}
        {generating && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        )}

        {generated.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Generated for you</p>
            {generated.map((outfit, i) => {
              const outfitItems = outfit.item_ids.map(id => itemMap[id]).filter(Boolean);
              const alreadySaved = savedOutfits.some(s => s.name === outfit.name);
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{outfit.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{outfit.occasion}</p>
                    </div>
                    <button
                      onClick={() => saveOutfit(outfit, i)}
                      disabled={savingId === i || alreadySaved}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                        alreadySaved
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                      }`}>
                      {alreadySaved ? '✓ Saved' : savingId === i ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">{outfit.description}</p>
                  {outfit.styling_tips && (
                    <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">💡 {outfit.styling_tips}</p>
                  )}
                  {outfitItems.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {outfitItems.map(item => (
                        <div key={item.id} className="flex items-center gap-1.5">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.thumbnail_url
                              ? <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-sm">👔</div>
                            }
                          </div>
                          <span className="text-xs text-gray-500 max-w-16 truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Saved outfits */}
        {!loading && savedOutfits.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Saved Outfits</p>
            {savedOutfits.map(outfit => {
              const outfitItems = (outfit.item_ids ?? []).map(id => itemMap[id]).filter(Boolean);
              return (
                <div key={outfit.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{outfit.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{outfit.occasion}</p>
                    </div>
                  </div>
                  {outfit.description && <p className="text-xs text-gray-600">{outfit.description}</p>}
                  {outfit.styling_tips && (
                    <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">💡 {outfit.styling_tips}</p>
                  )}
                  {outfitItems.length > 0 && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {outfitItems.map(item => (
                        <div key={item.id} className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.thumbnail_url
                            ? <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sm">👔</div>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
