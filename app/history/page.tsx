'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import AppShell from '@/components/AppShell';
import { ClothingItem, HistoryEntry, OCCASIONS } from '@/lib/types';

type EntryWithItems = HistoryEntry & { items: ClothingItem[] };

export default function HistoryPage() {
  const [entries, setEntries] = useState<EntryWithItems[]>([]);
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    outfit_name: '',
    occasion: 'Everyday',
    event_name: '',
    notes: '',
    item_ids: [] as string[],
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [{ data: history }, { data: clothing }] = await Promise.all([
      supabase.from('outfit_history').select('*').order('date', { ascending: false }),
      supabase.from('clothing_items').select('*'),
    ]);

    const clothingMap = Object.fromEntries((clothing ?? []).map(i => [i.id, i]));
    const enriched: EntryWithItems[] = (history ?? []).map(entry => ({
      ...entry,
      items: (entry.item_ids ?? []).map((id: string) => clothingMap[id]).filter(Boolean),
    }));

    setEntries(enriched);
    setWardrobeItems(clothing ?? []);
    setLoading(false);
  };

  const toggleItem = (id: string) => {
    setForm(prev => ({
      ...prev,
      item_ids: prev.item_ids.includes(id)
        ? prev.item_ids.filter(i => i !== id)
        : [...prev.item_ids, id],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { error: dbError } = await supabase.from('outfit_history').insert({
        user_id: user.id,
        date: form.date,
        outfit_name: form.outfit_name,
        occasion: form.occasion,
        event_name: form.event_name,
        notes: form.notes,
        item_ids: form.item_ids,
      });

      if (dbError) throw new Error(dbError.message);
      setShowForm(false);
      setForm({ date: new Date().toISOString().split('T')[0], outfit_name: '', occasion: 'Everyday', event_name: '', notes: '', item_ids: [] });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Outfit History</h2>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            + Log Outfit
          </button>
        </div>

        {/* Log form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Log an Outfit</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-900 text-xl">✕</button>
              </div>

              {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Occasion</label>
                  <select value={form.occasion} onChange={e => setForm(p => ({ ...p, occasion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                    {OCCASIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Outfit Name</label>
                  <input placeholder="e.g. Business casual Monday" value={form.outfit_name}
                    onChange={e => setForm(p => ({ ...p, outfit_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Event / Where</label>
                  <input placeholder="e.g. Team meeting, dinner with friends" value={form.event_name}
                    onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
                  <textarea placeholder="How did you feel? Any styling notes?" value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                </div>
              </div>

              {wardrobeItems.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items Worn (optional)</label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {wardrobeItems.map(item => (
                      <button key={item.id} type="button" onClick={() => toggleItem(item.id)}
                        className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 p-0 block transition-all ${
                          form.item_ids.includes(item.id)
                            ? 'border-gray-900 ring-2 ring-gray-900/10'
                            : 'border-gray-100 hover:border-gray-300'
                        }`}>
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">👔</div>
                        )}
                        {form.item_ids.includes(item.id) && (
                          <div className="absolute top-1 right-1 bg-gray-900 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleSave} disabled={saving || !form.date}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        )}

        {/* History list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">📅</div>
            <p className="font-medium text-gray-600">No history yet</p>
            <p className="text-sm mt-1">Log your first outfit to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{entry.outfit_name || 'Outfit'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.date)}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{entry.occasion}</span>
                </div>
                {entry.event_name && <p className="text-xs text-gray-500">📍 {entry.event_name}</p>}
                {entry.notes && <p className="text-xs text-gray-500 italic">"{entry.notes}"</p>}
                {entry.items.length > 0 && (
                  <div className="flex gap-1.5 pt-1 flex-wrap">
                    {entry.items.map(item => (
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
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
