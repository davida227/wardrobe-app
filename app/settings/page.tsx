'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import AppShell from '@/components/AppShell';
import { AI_MODELS, UserProfile } from '@/lib/types';

const MEASUREMENT_KEYS = [
  { key: 'height', label: 'Height (e.g. 5\'10" or 178cm)' },
  { key: 'weight', label: 'Weight (e.g. 160lbs or 72kg)' },
  { key: 'chest', label: 'Chest size (e.g. 38" or 96cm)' },
  { key: 'waist', label: 'Waist size (e.g. 32" or 81cm)' },
  { key: 'shoeSize', label: 'Shoe Size (e.g. US 10 or EU 43)' },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferredModel, setPreferredModel] = useState<string>('claude-sonnet-4-20250514');
  const [styleNotes, setStyleNotes] = useState<string>('');
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setPreferredModel(data.preferred_model || 'claude-sonnet-4-20250514');
        setStyleNotes(data.style_notes || '');
        setMeasurements(data.measurements || {});
      }
      setLoading(false);
    };

    loadProfile();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          preferred_model: preferredModel,
          style_notes: styleNotes,
          measurements: measurements,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setToast({ message: 'Settings saved successfully! ✨', type: 'success' });
      
      // Auto-hide toast
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleMeasurementChange = (key: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto space-y-6 animate-pulse mt-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto mt-2">
        <div className="mb-6">
          <h2 className="font-serif text-3xl font-bold text-gray-900 tracking-tight">AI & Style Profile Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your preferred AI stylist engine and customize your personal styling profile.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* AI Stylist Model Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>🤖</span> AI Stylist Model
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Select which AI intelligence will drive your clothing analysis and outfit recommendations. Choose Claude for classic styling or Gemini for rapid, modern suggestions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AI_MODELS.map(model => {
                const isSelected = preferredModel === model.id;
                const isGemini = model.id.startsWith('gemini');
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setPreferredModel(model.id)}
                    className={`relative p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isGemini
                          ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20'
                          : 'border-amber-600 bg-amber-50/20 ring-2 ring-amber-600/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isGemini 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isGemini ? 'Google Gemini' : 'Anthropic Claude'}
                      </span>
                      {isSelected && (
                        <span className={`text-xs font-bold ${isGemini ? 'text-blue-500' : 'text-amber-700'}`}>
                          ✓ Active
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-gray-900 text-sm">{model.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isGemini 
                          ? 'Lightning fast multimodal analysis' 
                          : 'Nuanced fashion styling advice'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Profile Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>✨</span> Personal Style Notes
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Describe your personal fashion choices, fits, palette selections, or dress code specifications. These will be fed straight into the AI stylist to customize recommendations.
            </p>
            <textarea
              value={styleNotes}
              onChange={e => setStyleNotes(e.target.value)}
              placeholder="e.g. I prefer minimal design with neutral color palettes (blacks, greys, earth tones). I prefer relaxed and comfortable fit tops, slim-straight denim, and avoid formal blazers unless requested."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none bg-gray-50/30"
            />
          </div>

          {/* Sizing & Measurements Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>📏</span> Sizing & Measurements
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Provide optional sizing to help the AI stylist understand your dimensions and suggest proportionally balanced fits.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MEASUREMENT_KEYS.map(item => (
                <div key={item.key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {item.label}
                  </label>
                  <input
                    type="text"
                    value={measurements[item.key] || ''}
                    onChange={e => handleMeasurementChange(item.key, e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className={`p-4 rounded-xl text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'
            }`}>
              {toast.message}
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {saving ? 'Saving changes...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
