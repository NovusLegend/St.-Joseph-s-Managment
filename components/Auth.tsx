
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, ArrowRight, ShieldCheck, School, Lock, PenTool } from 'lucide-react';

export const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'teacher' | 'admin' | 'editor'>('teacher');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role, // Use selected role
              full_name: email.split('@')[0], // Default name
            },
          },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-fade-in">
        
        {/* Left Side: Brand */}
        <div className="w-full md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white mix-blend-overlay filter blur-xl"></div>
             <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-indigo-400 mix-blend-overlay filter blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center mb-6">
               <School size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">St. Joseph's</h1>
            <p className="text-indigo-200">Management System</p>
            <p className="text-indigo-100/60 text-sm mt-4">Excellence in Education and Management.</p>
          </div>

          <div className="space-y-4 relative z-10">
             <div className="flex items-center gap-3 text-sm text-indigo-100">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={16} />
                </div>
                <span>Secure Portal Access</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-indigo-100">
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Loader2 size={16} />
                </div>
                <span>Real-time Updates</span>
             </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome back' : 'Create account'}</h2>
            <p className="text-slate-500 text-sm mt-1">
              {isLogin ? 'Please enter your credentials to sign in.' : 'Join the school ecosystem.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Role Toggle for Signup */}
            {!isLogin && (
              <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    role === 'teacher' 
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setRole('editor')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    role === 'editor' 
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <PenTool size={12} className={role === 'editor' ? 'text-indigo-600' : 'text-slate-400'} />
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    role === 'admin' 
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Lock size={12} className={role === 'admin' ? 'text-indigo-600' : 'text-slate-400'} />
                  Admin
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="user@school.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                 {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isLogin ? 'Sign In' : `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
