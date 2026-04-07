'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function Toast({ message, onUndo, onDismiss }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const duration = 5000;
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const timer = setTimeout(onDismiss, duration);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl z-[300] min-w-[280px] max-w-[420px] text-sm overflow-hidden">
      <span className="flex-1">{message}</span>
      <button onClick={onUndo} className="bg-white/20 text-white border-none rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-white/30 transition-colors">
        Undo
      </button>
      <button onClick={onDismiss} className="text-white/50 hover:text-white text-sm px-1">✕</button>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
        <div className="h-full bg-white/40 transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
