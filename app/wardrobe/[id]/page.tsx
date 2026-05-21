'use client';

/**
 * Item detail page — /wardrobe/[id]
 *
 * Two modes:
 *  - View mode: shows the full image and all item fields read-only
 *  - Edit mode: fields become editable inputs; changes are saved to Supabase
 *
 * Also allows deleting the item, which navigates back to /wardrobe.
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import AppShell from '@/components/AppShell';
import { ClothingItem, CATEGORIES, SEASONS, FORMALITY } from '@/lib/types';

export default function ItemDetailPage() {
  const [item, setItem] = useState<ClothingItem | null>(null);
  const [edits, setEdits] = useState<Partial<ClothingItem>>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id) // ensure users can only view their own items
        .single();

      if (error || !data) { router.push('/wardrobe'); return; }
      setItem(data);
      setLoading(false);
    };
    load();
  }, []);

  /** Enter edit mode — seed the edits state with current item values. */
  const handleEdit = () => {
    setEdits({ ...item });
    setEditing(true);
    setError('');
  };

  /** Discard changes and return to view mode. */
  const handleCancel = () => {
    setEdits({});
    setEditing(false);
    setError('');
  };

  /** Save changes to Supabase and return to view mode. */
  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    setError('');

    const { data, error } = await supabase
      .from('clothing_items')
      .update(edits)
      .eq('id', item.id)
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setItem(data);
      setEditing(false);
    }
    setSaving(false);
  };

  /** Delete the item and navigate back to the wardrobe grid. */
  const handleDelete = async () => {
    if (!item || !confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await supabase.from('clothing_items').delete().eq('id', item.id);
    router.push('/wardrobe');
  };

  /** Update a single field in the edits state. */
  const set = (field: keyof ClothingItem, value: any) =>
    setEdits(prev => ({ ...prev, [field]: value }));

  const toggleSeason = (season: string) => {
    const current = (edits.seasons ?? item?.seasons ?? []) as string[];
    set('seasons', current.includes(season)
      ? current.filter(s => s !== season)
      : [...current, season]
    );
  };

  // Convenience: in view mode read from item; in edit mode read from edits
  const val = <K extends keyof ClothingItem>(field: K) =>
    editing ? (edits[field] ?? item?.[field]) : item?.[field];

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto space-y-4 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="h-6 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
        </div>
      </AppShell>
    );
  }

  if (!item) return null;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Back link */}
        <button onClick={() => router.push('/wardrobe')}
          className="text-sm text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1">
          ← Back to wardrobe
        </button>

        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">👔</div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCancel}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEdit}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                Edit
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">

          {/* Name */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</label>
            {editing ? (
              <input value={val('name') as string} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            ) : (
              <p className="text-sm font-medium">{val('name') as string}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
            {editing ? (
              <select value={val('category') as string} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            ) : (
              <p className="text-sm">{val('category') as string}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Color</label>
            {editing ? (
              <input value={val('color') as string} onChange={e => set('color', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            ) : (
              <p className="text-sm">{val('color') as string}</p>
            )}
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pattern</label>
            {editing ? (
              <input value={val('pattern') as string} onChange={e => set('pattern', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            ) : (
              <p className="text-sm">{val('pattern') as string}</p>
            )}
          </div>

          {/* Fabric */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fabric</label>
            {editing ? (
              <input value={val('fabric') as string} onChange={e => set('fabric', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            ) : (
              <p className="text-sm">{val('fabric') as string}</p>
            )}
          </div>

          {/* Formality */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Formality</label>
            {editing ? (
              <select value={val('formality') as string} onChange={e => set('formality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                {FORMALITY.map(f => <option key={f}>{f}</option>)}
              </select>
            ) : (
              <p className="text-sm">{val('formality') as string}</p>
            )}
          </div>

          {/* Seasons */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seasons</label>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {SEASONS.map(s => {
                  const active = ((edits.seasons ?? item.seasons) as string[]).includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSeason(s)}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(val('seasons') as string[])?.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
            {editing ? (
              <textarea value={val('notes') as string} onChange={e => set('notes', e.target.value)}
                rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
            ) : (
              <p className="text-sm text-gray-600">{val('notes') as string || '—'}</p>
            )}
          </div>

        </div>
      </div>
    </AppShell>
  );
}
