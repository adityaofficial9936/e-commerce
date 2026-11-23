'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useStaffAuth } from '../../context/StaffAuthContext';

export default function StaffLoginPage() {
  const router = useRouter();
  const { authenticateStaff } = useStaffAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await authenticateStaff(email, password);
      if (res.success && res.staff) {
        setSuccessMessage(`Welcome back, ${res.staff.name}! Accessing ${res.staff.roleLabel} desk...`);
        setTimeout(() => {
          const defaultNav = res.staff?.allowedNav[0] || '/';
          router.push(defaultNav);
        }, 600);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please check your credentials.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage('An unexpected error occurred during authentication. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8 relative selection:bg-blue-600 selection:text-white">
      {/* Background glow and subtle mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-7 z-10 my-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full shadow-inner mb-2">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center font-black text-white text-xs">
              M
            </div>
            <span className="font-extrabold text-white text-xs tracking-tight">Moonlet Ops</span>
            <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/50">
              Operations Console
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Administrative Staff Sign-In
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Role-Based Access Control (RBAC) portal for fulfillment, finance, catalog, and support teams.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-500/50 rounded-2xl p-3.5 text-rose-300 text-xs font-medium flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3.5 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="e.g. aditya.admin@moonlet.in"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Access Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1 focus:outline-none"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                  placeholder="Enter your security password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] text-slate-500">2FA Verified</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Operations'}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Protected by Moonlet Enterprise RBAC & 256-bit TLS</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Accounts and credentials are created and managed securely by the Super Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
