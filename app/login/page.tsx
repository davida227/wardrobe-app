'use client';

/**
 * LoginPage — handles all authentication flows on a single screen:
 *
 *  1. Sign in     — email + password → redirect to /wardrobe
 *  2. Sign up     — email + password → account created instantly (no confirmation email)
 *  3. Forgot pwd  — inline panel sends a reset link to the user's email
 *  4. Reset pwd   — shown automatically when the user arrives via a password reset
 *                   email link (?type=recovery). The auth/callback route has already
 *                   exchanged the one-time code for a session before redirecting here.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

/** The three visual states this page can be in. */
type Mode = 'signin' | 'signup' | 'reset';

export default function LoginPage() {
  // ── Form field state ─────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');       // used only in reset mode
  const [forgotEmail, setForgotEmail] = useState(''); // separate field in the forgot panel

  // ── UI state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('signin');
  const [showForgot, setShowForgot] = useState(false); // toggles the inline forgot panel
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');         // success messages (e.g. reset link sent)

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // ── Detect password-reset redirect ───────────────────────────────────────
  // When a user clicks the reset link in their email they are routed through
  // /auth/callback which exchanges the one-time code for a session and then
  // redirects here with ?type=recovery. We just need to switch to reset mode;
  // the session is already set in the browser cookies by the callback.
  useEffect(() => {
    if (searchParams.get('type') === 'recovery') {
      setMode('reset');
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const clearMessages = () => { setError(''); setMessage(''); };

  // ── Auth handlers ─────────────────────────────────────────────────────────

  /** Sign in with email + password. Redirects to /wardrobe on success. */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else { router.push('/wardrobe'); router.refresh(); }
    setLoading(false);
  };

  /**
   * Create a new account with email + password.
   * Email confirmation is disabled in Supabase, so the account is active
   * immediately and the user is redirected to /wardrobe on success.
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else { router.push('/wardrobe'); router.refresh(); }
    setLoading(false);
  };

  /**
   * Send a password reset email.
   * Supabase emails a link that routes through /auth/callback?type=recovery,
   * which exchanges the code for a session and redirects back to this page
   * in reset mode.
   */
  const handleForgot = async () => {
    if (!forgotEmail) return;
    clearMessages();
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo });
    if (error) setError(error.message);
    else { setMessage('Check your email for a reset link.'); setShowForgot(false); }
    setLoading(false);
  };

  /**
   * Update the user's password.
   * Only reachable after arriving via a reset email link, at which point the
   * session is already active and updateUser() can be called directly.
   */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else { router.push('/wardrobe'); router.refresh(); }
    setLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👔</div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Wardrobe</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'reset' ? 'Choose a new password' : 'AI-powered personal stylist'}
          </p>
        </div>

        {/* ── Reset password form ── */}
        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required minLength={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}

        {/* ── Sign in / Sign up form ── */}
        {mode !== 'reset' && (
          <>
            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
                  {/* Forgot password link — only shown on the sign-in screen */}
                  {mode === 'signin' && (
                    <button type="button" onClick={() => { setShowForgot(v => !v); clearMessages(); }}
                      className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>

              {/* Inline forgot-password panel — expands below the password field */}
              {showForgot && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <p className="text-xs text-gray-500">Enter your email and we'll send a reset link.</p>
                  <div className="flex gap-2">
                    <input type="email" placeholder="your@email.com" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
                    <button type="button" disabled={loading} onClick={handleForgot}
                      className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap">
                      {loading ? '...' : 'Send link'}
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
              {message && <div className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">{message}</div>}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Toggle between sign in and sign up */}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setShowForgot(false); clearMessages(); }}
              className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
