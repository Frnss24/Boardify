"use client";

import { useState } from 'react';
import { ChevronLeft, User, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import boardifyLogo from '../../../asset/Boardify.png'; 

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Semua field wajib diisi!');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: identifier.trim().toLowerCase(),
        password,
      });

      if (signInError || !data.session || !data.user) {
        setError(signInError?.message || 'Login gagal');
        return;
      }

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      let resolvedRole = userRecord?.role || data.user.user_metadata?.role || 'user';

      if (userError) {
        void fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            role: resolvedRole,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          }),
        }).catch((syncError) => {
          console.error('Sync user failed:', syncError);
        });
      }

      // Redirect berdasarkan role
      if (resolvedRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#E0F2F1] overflow-hidden font-sans">
      {/* BACKGROUND MESH ASLI */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/40 blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-400/30 blur-[100px]" />
      </div>

      {/* Tombol Back */}
      <Link 
        href="/admin" 
        className="absolute top-6 left-6 z-20 p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-slate-800"
      >
        <ChevronLeft size={24} />
      </Link>

      {/* Container Utama */}
      <div className="relative z-10 w-full max-w-[900px] h-[550px] flex mx-4 overflow-hidden rounded-[40px] shadow-2xl border border-white/30 group">
        
        {/* SISI KIRI: Form Login (Glassmorphism Murni) */}
        <div className="flex-1 bg-white/20 backdrop-blur-3xl p-12 flex flex-col justify-center border-r border-white/20">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-slate-800 tracking-widest uppercase mb-8">LOGIN</h1>
            
            {/* ALERT WARNING - Muncul pas validasi gagal */}
            <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-20 mb-6' : 'max-h-0'}`}>
              <div className="bg-red-500 text-white p-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-red-200">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-[11px] font-bold text-left leading-tight">{error}</p>
              </div>
            </div>

            <form className="space-y-8 text-left max-w-[320px] mx-auto" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">EMAIL</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  <input 
                    type="email" 
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                    className="w-full bg-white/20 border-2 border-white/40 rounded-full py-2.5 pl-12 pr-6 text-slate-800 outline-none focus:border-white focus:bg-white transition-all placeholder:text-slate-500"
                    placeholder="admin@boardify.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">PASSWORD</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full bg-white/20 border-2 border-white/40 rounded-full py-2.5 pl-12 pr-12 text-slate-800 outline-none focus:border-white focus:bg-white transition-all placeholder:text-slate-500"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white font-black py-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.97] uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:bg-indigo-400"
                >
                  {isLoading ? 'LOADING...' : 'SIGN IN'}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
                
                <p className="text-[12px] text-slate-500 font-medium tracking-tight">
                  Don't have an account?{' '}
                  <Link href="/register">
                    <span className="text-[#5145f5] font-black cursor-pointer hover:underline ml-1">
                      SIGN UP
                    </span>
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* SISI KANAN: Logo Boardify (Solid White) */}
        <div className="hidden md:flex flex-[0.8] bg-white p-12 flex flex-col items-center justify-center relative">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 relative mb-4">
              <Image 
                src={boardifyLogo}
                alt="Boardify Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Boardify</h2>
          </div>
        </div>

      </div>
    </div>
  );
}