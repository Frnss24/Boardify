"use client";

import { useState } from 'react';
import { ChevronLeft, User, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import boardifyLogo from '../../../asset/Boardify.png'; 

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState('');

  // inisialisasi supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // cek minimal 1 karakter spesial/unik
    const specialCharRegx = /[!@#$%^&*(),.?":{}|<>]/;

    // cek kosong
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Wajib diisi semua!');
      return;
    }

    // cek panjang pw
    if (password.length < 8) {
      setError('Password minimal harus 8 karakter!');
      return;
    }

    // cek karakter unik
    if (!specialCharRegx.test(password)) {
      setError('Password harus punya minimal 1 karakter unik (contoh: @, #, $)!');
      return;
    }

    setIsLoading(true);

    //daftarin ke supabase auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (signUpError) {
      setError(signUpError.message); 
      setIsLoading(false);
      return;
    }

    // masuk ke tabel profiles
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          name: fullName,
          email: email,
          role: 'user' 
        }
      ]);

      if (profileError) {
        setError('Akun berhasil dibuat, tapi gagal mwnyimpan profil!');
        setIsLoading(false);
        return;
      }
    }

    // kalau sukses, arahin langsung ke halaman User Dashboard
    router.push('/user');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#E0F2F1] overflow-hidden font-sans">
      {/* Background Mesh Gradient - Identitas Visual */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/40 blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-400/30 blur-[100px]" />
      </div>

      <Link href="/login" className="absolute top-6 left-6 z-20 p-3 bg-white rounded-2xl shadow-sm hover:scale-110 transition-all text-slate-800">
        <ChevronLeft size={24} />
      </Link>

      <div className="relative z-10 w-full max-w-[900px] h-[600px] flex mx-4 overflow-hidden rounded-[40px] shadow-2xl border border-white/30">
        
        {/* Sisi Kiri (Branding & Logo) */}
        <div className="hidden md:flex flex-[0.8] bg-white p-12 flex flex-col items-center justify-center relative border-r border-slate-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 relative mb-4">
              <Image src={boardifyLogo} alt="Boardify Logo" fill className="object-contain" priority />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Boardify</h2>
          </div>
        </div>

        {/* Sisi Kanan (Form dengan Glassmorphism) */}
        <div className="flex-1 bg-white/20 backdrop-blur-3xl p-10 flex flex-col justify-center">
          <div className="max-w-[340px] mx-auto w-full text-center">
            <h1 className="text-4xl font-black text-slate-800 tracking-widest uppercase mb-6">SIGN UP</h1>
            
            {/* ALERT WARNING */}
            <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-20 mb-4' : 'max-h-0'}`}>
              <div className="bg-red-500 text-white p-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-red-200">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-[11px] font-bold text-left leading-tight">{error}</p>
              </div>
            </div>

            <form className="space-y-4 text-left" onSubmit={handleRegister} noValidate>
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">FULL NAME</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="text" 
                    placeholder="Masukkan nama lengkap"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(''); }}
                    className="w-full bg-white/30 border-2 border-white/50 rounded-full py-2.5 pl-12 pr-6 text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-500 text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="email" 
                    placeholder="email@undip.ac.id"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="w-full bg-white/30 border-2 border-white/50 rounded-full py-2.5 pl-12 pr-6 text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-500 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="8+ karakter & unik"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full bg-white/30 border-2 border-white/40 rounded-full py-2.5 pl-12 pr-12 text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-500 text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[#5145f5] text-white font-black py-3 rounded-full shadow-lg hover:bg-[#4338ca] transition-all active:scale-[0.97] uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:bg-indigo-300"
                >
                  {isLoading ? 'PROCESSING...' : 'GET STARTED'}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
                <p className="text-[12px] text-slate-500 font-medium tracking-tight">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#5145f5] font-black cursor-pointer hover:underline ml-1 uppercase">LOG IN</Link>
                </p>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}