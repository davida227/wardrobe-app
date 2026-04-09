'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import AppShell from '@/components/AppShell';
import { CATEGORIES, SEASONS, FORMALITY } from '@/lib/types';
import { fileToBase64, compressImage, uploadImage } from '@/lib/image-utils';

type Analysis = {
  name: string;
  category: string;
  color: string;
  pattern: string;
  fabric: string;
  formality: string;
  seasons: string[];
  notes: string;
};

export default function AddPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFile = async (file: File) => {
    setError('');
    setAnalysis(null);
    const base64 = await fileToBase64(file);
    const compressed = await compressImage(base64, 800, 0.8);
    setImagePreview(compressed);
    setImageBase64(compressed);
    analyzeImage(compressed);
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e: any) {
      setError('Analysis failed: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysis || !imageBase64) return;
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const imageUrl = await uploadImage(supabase, user.id, imageBase64, 'item');
      const thumbBase64 = await compressImage(imageBase64, 300, 0.7);
      const thumbnailUrl = await uploadImage(supabase, user.id, thumbBase64, 'thumb');

      const { error: dbError } = await supabase.from('clothing_items').insert({
        user_id: user.id,
        name: analysis.name,
        category: analysis.category,
        color: analysis.color,
        pattern: analysis.pattern,
        fabric: analysis.fabric,
        formality: analysis.formality,
        seasons: analysis.seasons,
        notes: analysis.notes,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
      });

      if (dbError) throw new Error(dbError.message);
      router.push('/wardrobe');
    } catch (e: any) {
      setError('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof Analysis, value: any) =>
    setAnalysis(prev => prev ? { ...prev, [field]: value } : prev);

  const toggleSeason = (season: string) => {
    if (!analysis) return;
    const seasons = analysis.seasons.includes(season)
      ? analysis.seasons.filter(s => s !== season)
      : [...analysis.seasons, season];
    update('seasons', seasons);
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-6">
        <h2 className="text-lg font-semibold">Add Clothing Item</h2>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="relative border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-400 transition-colors"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-contain bg-gray-50" />
          ) : (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-2">📷</div>
              <p className="font-medium text-gray-600">Upload a photo</p>
              <p className="text-sm mt-1">Tap or drag & drop</p>
            </div>
          )}
          {analyzing && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
              <div className="text-2xl animate-spin">✨</div>
              <p className="text-sm font-medium text-gray-700 mt-2">Analyzing...</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

        {/* Editable analysis */}
        {analysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <span>✓</span> Analysis complete — review and edit before saving
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</label>
                <input value={analysis.name} onChange={e => update('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                <select value={analysis.category} onChange={e => update('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Color</label>
                <input value={analysis.color} onChange={e => update('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pattern</label>
                <input value={analysis.pattern} onChange={e => update('pattern', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fabric</label>
                <input value={analysis.fabric} onChange={e => update('fabric', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Formality</label>
                <select value={analysis.formality} onChange={e => update('formality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                  {FORMALITY.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seasons</label>
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSeason(s)}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        analysis.seasons.includes(s)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
                <textarea value={analysis.notes} onChange={e => update('notes', e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save to Wardrobe'}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
