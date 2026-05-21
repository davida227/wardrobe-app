'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import AppShell from '@/components/AppShell';
import { ClothingItem, CATEGORIES } from '@/lib/types';

const ALL = 'All';

export default function WardrobePage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('clothing_items')
        .select('*')
        .order('created_at', { ascending: false });

      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = activeCategory === ALL
    ? items
    : items.filter(i => i.category === activeCategory);

  return (
    <AppShell itemCount={items.length}>
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {[ALL, ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activeCategory === cat
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {items.length === 0 ? (
            <>
              <div className="text-5xl mb-3">👔</div>
              <p className="font-medium text-gray-600">Your wardrobe is empty</p>
              <p className="text-sm mt-1">Add your first piece to get started</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">No items in {activeCategory}</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(item => (
            <Link key={item.id} href={`/wardrobe/${item.id}`}
              className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
              {item.thumbnail_url || item.image_url ? (
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                  {categoryIcon(item.category)}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium truncate">{item.name}</p>
                {item.color && <p className="text-white/70 text-xs truncate">{item.color}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function categoryIcon(category: string) {
  const icons: Record<string, string> = {
    Tops: '👕', Bottoms: '👖', Outerwear: '🧥', Shoes: '👟',
    Accessories: '👜', Dresses: '👗', Activewear: '🩱', Formal: '🤵',
  };
  return icons[category] ?? '👔';
}
