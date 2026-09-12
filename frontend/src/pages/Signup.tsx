import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';

// 🔹 Password Validation Regex (Same as Backend)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuthStore() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 🔹 Passwords match check
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // 🔹 Frontend Password Combination Check
    if (!passwordRegex.test(password)) {
      setError('Password must be 8-16 chars and include uppercase, lowercase, number, and a special character.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await api.auth.signup({ name, email, password });
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      // 🔹 Rate Limiter Error Handling
      if (err.message?.toLowerCase().includes('too many requests') || err.status === 429) {
        setError('Too many signup attempts. Please try again after 15 minutes.');
      } else {
        setError(err.message || 'Failed to sign up');
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
            Create an account <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">Join ChatAI Pro & unlock multi-model intelligence</p>
        </div>

        {/* 🔹 Error Message Box */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl flex items-start gap-2.5 animate-shake">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all text-sm"
              placeholder="John Doe"
              required
            />
          </div>
          
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
                maxLength={16}
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
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all text-sm"
                placeholder="••••••••"
                required
                maxLength={16}
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-500" />
              <span className="text-xs text-zinc-400 leading-relaxed">
                I agree to the <a href="#" className="text-indigo-400 hover:underline">Terms & Conditions</a> and <a href="#" className="text-indigo-400 hover:underline">Privacy Policy</a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed text-sm active:scale-[0.98]"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}