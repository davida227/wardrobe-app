'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const tabs = [
  { href: '/wardrobe', label: 'Wardrobe', icon: '🗄️' },
  { href: '/wardrobe/add', label: 'Add', icon: '➕' },
  { href: '/outfits', label: 'Outfits', icon: '✨' },
  { href: '/history', label: 'History', icon: '📅' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function AppShell({ children, itemCount }: { children: React.ReactNode; itemCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200/60 bg-white/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">Wardrobe</h1>
              {itemCount !== undefined && (
                <span className="text-sm text-gray-400 font-medium">{itemCount} pieces</span>
              )}
            </div>
            <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
              Sign Out
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(t => {
              const isActive = pathname === t.href || (t.href !== '/wardrobe' && pathname.startsWith(t.href)) || (t.href === '/wardrobe' && pathname === '/wardrobe');
              // Special case: /wardrobe/add should highlight "Add" not "Wardrobe"
              const isAddPage = pathname === '/wardrobe/add';
              const highlight = isAddPage ? t.href === '/wardrobe/add' : (t.href === '/wardrobe' ? pathname === '/wardrobe' : pathname.startsWith(t.href));
              return (
                <Link key={t.href} href={t.href}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all ${
                    highlight ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}>
                  {t.icon} {t.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {children}
      </div>
    </div>
  );
}
