import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Bot, Sparkles, KeyRound, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { GoogleLogin } from '@react-oauth/google';

// 🔹 Password Validation Regex (Same as Backend)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA Login States
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuthStore() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 🔹 Frontend Password Combination Check
    if (!requires2FA && !passwordRegex.test(password)) {
      setError('Password must be 8-16 chars and include uppercase, lowercase, number, and a special character.');
      setIsLoading(false);
      return;
    }
    
    try {
      const payload: any = { email, password };
      if (requires2FA) {
        payload.twoFactorToken = twoFactorToken;
      }

      const data = await api.auth.login(payload);
      
      // Agar backend bole ki 2FA code required hai
      if (data.requires2FA) {
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }

      // Normal or 2FA Verified Login Success
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      // 🔹 Rate Limiter Error Handling
      if (err.message?.toLowerCase().includes('too many requests') || err.status === 429) {
        setError('Too many login attempts. Please try again after 15 minutes.');
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      
      {/* 🌙 Background Glowing Orb Effect */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-600/30 via-purple-600/30 to-pink-600/30 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-900/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-zinc-800/80 p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-40 animate-pulse rounded-2xl"></div>
            <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 border border-white/20">
              <Bot className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {requires2FA ? 'Two-Factor Check' : 'Welcome back'} <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            {requires2FA ? 'Enter your authenticator app code' : 'Sign in to continue to ChatAI Pro'}
          </p>
        </div>

        {/* 🔹 Error Message Box */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all text-sm pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                {/* <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-500" />
                  <span className="text-xs text-zinc-400">Remember me</span>
                </label> */}
                {/* <a href="#" className="text-xs font-medium text-indigo-400 hover:underline">Forgot password?</a> */}
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl mb-4">
                <KeyRound className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                <p className="text-xs text-indigo-300">Protected with 2FA. Enter the 6-digit code from your Authenticator app.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1.5">Authenticator Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="w-full text-center tracking-widest text-xl font-mono px-4 py-3 bg-zinc-950/60 border border-indigo-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-600"
                  placeholder="123456"
                  autoFocus
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => { setRequires2FA(false); setTwoFactorToken(''); }}
                className="w-full text-xs text-zinc-400 hover:text-zinc-200 text-center py-1"
              >
                ← Back to regular login
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed text-sm active:scale-[0.98]"
          >
            {isLoading ? 'Processing...' : requires2FA ? 'Verify & Sign In' : 'Sign In'}
          </button>
        </form>

        {!requires2FA && (
          <>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-800"></div>
              <span className="text-xs text-zinc-500">or continue with</span>
              <div className="flex-1 h-px bg-zinc-800"></div>
            </div>

            {/* Real Google OAuth Login Button */}
            {/* Real Google OAuth Login Button */}
            <div className="mt-6 flex justify-center w-full">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setError('');
                  try {
                    const data = await api.auth.googleLogin({ token: credentialResponse.credential });
                    login(data.token, data.user);
                    navigate('/');
                  } catch (err: any) {
                    setError(err.message || 'Google login failed');
                  }
                }}
                onError={() => {
                  setError('Google popup authentication failed');
                }}
                theme="filled_black"
                shape="pill"          // 🔹 Oval/Pill shape ke liye
                text="continue_with"  // 🔹 Professional text: "Continue with Google"
                width="100%"
              />
            </div>
          </>
        )}

        <p className="mt-8 text-center text-xs text-zinc-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-indigo-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}