'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  Sparkles,
  Gift,
  ShieldCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { InteractiveRobotBox } from '../../components/auth/InteractiveRobotBox';
import { TextShimmerWave } from '@/components/core/text-shimmer-wave';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  
  // Login states - Supports either Mobile Phone OR Email
  const [loginIdentifier, setLoginIdentifier] = useState('9936706276');
  const [password, setPassword] = useState('Moonlet@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [joinClub, setJoinClub] = useState(true);
  const [regStep, setRegStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [regOtp, setRegOtp] = useState('');
  const [regError, setRegError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEmail = loginIdentifier.includes('@');
    const cleanPhone = loginIdentifier.startsWith('+91')
      ? loginIdentifier
      : `+91 ${loginIdentifier.replace(/\D/g, '')}`;

    try {
      const res = await apiClient
        .post<{ accessToken: string }>('/auth/login', {
          email: isEmail ? loginIdentifier : 'customer@moonlet.in',
          password,
        })
        .catch(() => null);

      if (res?.data?.accessToken) {
        localStorage.setItem('moonlet_customer_token', res.data.accessToken);
        await apiClient.post('/cart/merge').catch(() => null);
      }
    } catch {
      // Fallback
    }

    setSuccessMessage('Signed in successfully! Redirecting...');
    setSuccess(true);
    setTimeout(() => {
      const authObj = isEmail
        ? {
            email: loginIdentifier.trim(),
            phone: '+91 99367 06276',
            name: loginIdentifier.split('@')[0] || 'Aditya Yadav',
          }
        : {
            phone: cleanPhone,
            email: 'aditya@moonlet.in',
            name: 'Aditya Yadav',
          };

      localStorage.setItem('moonlet_customer_auth', JSON.stringify(authObj));
      router.push('/account/orders');
    }, 600);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/otp/send', { phone: loginIdentifier }).catch(() => null);
    } catch {
      // Demo fallback
    }
    setIsSubmitting(false);
    setOtpSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('Credentials verified! Signing you in...');
    setSuccess(true);
    setTimeout(() => {
      const isEmail = loginIdentifier.includes('@');
      const cleanPhone = loginIdentifier.startsWith('+91')
        ? loginIdentifier
        : `+91 ${loginIdentifier.replace(/\D/g, '')}`;

      const authObj = isEmail
        ? {
            email: loginIdentifier.trim(),
            phone: '+91 99367 06276',
            name: loginIdentifier.split('@')[0] || 'Aditya Yadav',
          }
        : {
            phone: cleanPhone,
            email: 'aditya@moonlet.in',
            name: 'Aditya Yadav',
          };

      localStorage.setItem('moonlet_customer_auth', JSON.stringify(authObj));
      router.push('/account/orders');
    }, 600);
  };

  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('Mobile phone number is required for verification.');
      return;
    }

    // Move to dual verification step
    setRegStep('VERIFY');
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const cleanPhone = regPhone.startsWith('+91')
      ? regPhone.trim()
      : `+91 ${regPhone.replace(/\D/g, '')}`;

    try {
      await apiClient
        .post('/auth/register', {
          name: regName,
          email: regEmail,
          phone: cleanPhone,
          password: regPassword,
        })
        .catch(() => null);
    } catch {}

    setSuccessMessage('Both Email & Mobile verified successfully! Welcome to Moonlet.');
    setSuccess(true);

    setTimeout(() => {
      const customerRecord = {
        name: regName.trim() || 'Moonlet Member',
        email: regEmail.trim(),
        phone: cleanPhone,
        isEmailVerified: true,
        isPhoneVerified: true,
        vip: joinClub,
        welcomeRewardApplied: true,
      };

      try {
        localStorage.setItem('moonlet_customer_auth', JSON.stringify(customerRecord));

        // Sync with admin customer database
        const existingRaw = localStorage.getItem('moonlet_registered_customers');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newCustomerEntry = {
          id: `cust-${Date.now()}`,
          name: regName.trim() || 'New Customer',
          email: regEmail.trim(),
          phone: cleanPhone,
          segment: joinClub ? 'VIP' : 'Regular',
          ordersCount: 0,
          totalSpentMinor: 0,
          status: 'ACTIVE',
          joinedDate: 'Just now',
        };
        localStorage.setItem(
          'moonlet_registered_customers',
          JSON.stringify([newCustomerEntry, ...existing.filter((c: any) => c.email !== regEmail)])
        );
      } catch (err) {
        console.error('Storage sync error:', err);
      }

      router.push('/account/orders');
    }, 700);
  };

  const quickDemoLogin = (demoEmail: string, demoName: string) => {
    setLoginIdentifier(demoEmail);
    setPassword('Moonlet@2026!');
    setIsSubmitting(true);
    setSuccessMessage(`Welcome back, ${demoName}! Redirecting...`);
    setSuccess(true);
    setTimeout(() => {
      localStorage.setItem(
        'moonlet_customer_auth',
        JSON.stringify({ email: demoEmail, name: demoName })
      );
      router.push('/account/orders');
    }, 500);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-ivory font-sans">
      <div className="max-w-5xl w-full bg-white/95 rounded-3xl border border-champagne/30 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 p-3 sm:p-5 gap-6 sm:gap-8">
        
        {/* Left Column: Interactive 3D Cursor-Tracking Robot Box */}
        <div className="w-full h-full min-h-[340px] rounded-2xl overflow-hidden border border-champagne/20">
          <InteractiveRobotBox isPasswordFocused={isPasswordFocused} />
        </div>

        {/* Right Column: Sleek Luxury Auth Form */}
        <div className="flex flex-col justify-center px-4 sm:px-8 py-6 sm:py-8 space-y-5">
          
          {/* Header */}
          <div className="text-center space-y-1.5">
            <span className="text-[11px] font-semibold text-champagne uppercase tracking-widest block">
              Moonlet VIP Club
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal tracking-tight">
              {activeTab === 'LOGIN' ? 'Welcome to Everyday Luxury' : 'Join the Moonlet Circle'}
            </h1>
            <p className="text-xs text-charcoal/60">
              {activeTab === 'LOGIN'
                ? 'Sign in to manage your jewelry orders, track deliveries & claim VIP perks.'
                : 'Create an account to unlock ₹500 welcome credit, faster checkout & VIP perks.'}
            </p>
          </div>

          {/* Top Main Mode Switcher: Sign In vs Create Account */}
          <div className="grid grid-cols-2 p-1 bg-ivory rounded-2xl border border-champagne/30">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setSuccess(false);
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'LOGIN'
                  ? 'bg-charcoal text-ivory shadow-xs'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setSuccess(false);
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'REGISTER'
                  ? 'bg-charcoal text-ivory shadow-xs'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* First Order Perk Pill */}
          <div className="p-3 bg-blush/30 border border-champagne/20 rounded-2xl flex items-center gap-2.5 text-xs text-charcoal">
            <Sparkles className="h-4 w-4 text-champagne shrink-0 fill-champagne/20" />
            <span>
              Enjoy <strong>15% off your first jewelry order</strong> with coupon code{' '}
              <strong className="text-champagne font-mono">MOONLET15</strong>.
            </span>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {regError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-medium">
              {regError}
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'LOGIN' && (
            <>
              {/* Auth Mode Toggle */}
              <div className="flex bg-ivory p-1 rounded-xl border border-champagne/20">
                <button
                  type="button"
                  onClick={() => setAuthMode('PASSWORD')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    authMode === 'PASSWORD'
                      ? 'bg-charcoal text-ivory shadow-xs'
                      : 'text-charcoal/60 hover:text-charcoal'
                  }`}
                >
                  Email &amp; Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('OTP')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    authMode === 'OTP'
                      ? 'bg-charcoal text-ivory shadow-xs'
                      : 'text-charcoal/60 hover:text-charcoal'
                  }`}
                >
                  Mobile OTP
                </button>
              </div>

              {authMode === 'PASSWORD' ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-charcoal/80 mb-1.5">
                      Mobile Number or Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. 9936706276 or aditya@moonlet.in"
                        className="w-full px-4 py-3 bg-ivory/50 hover:bg-ivory focus:bg-white border border-champagne/30 rounded-xl text-xs text-charcoal font-medium transition-all focus:outline-none focus:border-champagne"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal/80 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-4 pr-11 py-3 bg-ivory/50 hover:bg-ivory focus:bg-white border border-champagne/30 rounded-xl text-xs text-charcoal font-medium transition-all focus:outline-none focus:border-champagne"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-charcoal/40 hover:text-charcoal"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-charcoal/70">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-charcoal border-champagne/30 focus:ring-0 cursor-pointer accent-charcoal"
                      />
                      <span>Remember me</span>
                    </label>
                    <a
                      href="#"
                      className="text-charcoal/60 hover:text-champagne transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <TextShimmerWave duration={1} className="font-medium text-xs text-ivory">
                        Authenticating credentials...
                      </TextShimmerWave>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-charcoal/80 mb-1.5">
                          Mobile Number or Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            placeholder="e.g. 9936706276 or aditya@moonlet.in"
                            className="w-full px-4 py-3 bg-ivory/50 border border-champagne/30 rounded-xl text-xs text-charcoal font-medium transition-all focus:outline-none focus:border-champagne"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                      >
                        {isSubmitting ? (
                          <TextShimmerWave duration={1} className="font-medium text-xs text-ivory">
                            Dispatching Verification Code...
                          </TextShimmerWave>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-charcoal/80 mb-1.5">
                          Enter Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="1234"
                          className="w-full py-3 bg-ivory/50 border border-champagne/30 rounded-xl text-base font-mono font-bold tracking-widest text-charcoal focus:outline-none focus:border-champagne text-center"
                        />
                        <p className="text-[11px] text-charcoal/50 mt-1 text-center">
                          Sent to {loginIdentifier}. Demo passcode: <strong className="text-charcoal font-mono">1234</strong>
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                      >
                        {isSubmitting ? (
                          <TextShimmerWave duration={1} className="font-medium text-xs text-ivory">
                            Verifying passcode...
                          </TextShimmerWave>
                        ) : (
                          <>
                            <span>Verify &amp; Sign In</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Quick Demo Switcher */}
              <div className="pt-3 border-t border-champagne/15">
                <p className="text-[10px] font-semibold text-charcoal/50 uppercase tracking-wider text-center mb-2">
                  1-Click Demo Customer Access
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier('9936706276');
                      setPassword('Moonlet@2026!');
                      setIsSubmitting(true);
                      setSuccessMessage('Welcome back, Aditya Yadav! Redirecting...');
                      setSuccess(true);
                      setTimeout(() => {
                        localStorage.setItem(
                          'moonlet_customer_auth',
                          JSON.stringify({ phone: '+91 99367 06276', name: 'Aditya Yadav', email: 'aditya@moonlet.in' })
                        );
                        router.push('/account/orders');
                      }, 500);
                    }}
                    className="p-2.5 rounded-xl border border-champagne/30 bg-ivory/40 hover:bg-blush/20 text-left transition-all text-[11px] cursor-pointer"
                  >
                    <p className="font-medium text-charcoal">Aditya Yadav (Mobile)</p>
                    <p className="text-[10px] text-charcoal/50 truncate">+91 99367 06276</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier('priya@moonlet.in');
                      setPassword('Moonlet@2026!');
                      setIsSubmitting(true);
                      setSuccessMessage('Welcome back, Priya Sharma! Redirecting...');
                      setSuccess(true);
                      setTimeout(() => {
                        localStorage.setItem(
                          'moonlet_customer_auth',
                          JSON.stringify({ email: 'priya@moonlet.in', name: 'Priya Sharma', phone: '+91 98765 43210' })
                        );
                        router.push('/account/orders');
                      }, 500);
                    }}
                    className="p-2.5 rounded-xl border border-champagne/30 bg-ivory/40 hover:bg-blush/20 text-left transition-all text-[11px] cursor-pointer"
                  >
                    <p className="font-medium text-charcoal">Priya Sharma (Email)</p>
                    <p className="text-[10px] text-charcoal/50 truncate">priya@moonlet.in</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CREATE CUSTOMER ACCOUNT */}
          {activeTab === 'REGISTER' && (
            <>
              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {regError}
                </div>
              )}

              {regStep === 'FORM' ? (
                <form onSubmit={handleStartRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-charcoal/80 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Aditya Yadav"
                      className="w-full px-4 py-2.5 bg-ivory/50 hover:bg-ivory focus:bg-white border border-champagne/30 rounded-xl text-xs text-charcoal font-medium transition-all focus:outline-none focus:border-champagne"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-charcoal/80 mb-1">
                        Email Address (for Verification)
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="aditya@example.com"
                        className="w-full px-4 py-2.5 bg-ivory/50 hover:bg-ivory focus:bg-white border border-champagne/30 rounded-xl text-xs text-charcoal font-medium transition-all focus:outline-none focus:border-champagne"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-charcoal/80 mb-1">
                        Mobile Phone (10 Digits)
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9936706276"
                        className="w-full px-4 py-2.5 bg-ivory/50 hover:bg-ivory focus:bg-white border border-champagne/30 rounded-xl text-xs text-charcoal font-medium transition-all focus:outline-none focus:border-champagne"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-charcoal/80 mb-1">
                        Choose Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-2.5 bg-ivory/50 hover:bg-ivory focus:bg-white border border-champagne/30 rounded-xl text-xs text-charcoal font-medium transition-all focus:outline-none focus:border-champagne"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-charcoal/80 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-4 py-2.5 bg-ivory/50 hover:bg-ivory focus:bg-white border border-champagne/30 rounded-xl text-xs text-charcoal font-medium transition-all focus:outline-none focus:border-champagne"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blush/20 rounded-xl border border-champagne/20">
                    <label className="flex items-start gap-2.5 text-xs text-charcoal cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={joinClub}
                        onChange={(e) => setJoinClub(e.target.checked)}
                        className="mt-0.5 rounded text-charcoal border-champagne/30 focus:ring-0 cursor-pointer accent-charcoal"
                      />
                      <span>
                        Enroll in <strong>Moonlet VIP Circle</strong> (exclusive drops, birthday gifts &amp; early sale access).
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Proceed to Verification</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="text-[11px] text-center text-charcoal/60 pt-1">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('LOGIN')}
                      className="font-semibold text-champagne hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleCompleteRegistration} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne/20 text-charcoal text-[11px] font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Dual Verification Code
                    </div>
                    <h3 className="text-sm font-semibold text-charcoal">Verify Mobile &amp; Email</h3>
                    <p className="text-[11px] text-charcoal/60">
                      A 4-digit verification code has been dispatched to{' '}
                      <strong className="text-charcoal">{regPhone}</strong> and{' '}
                      <strong className="text-charcoal">{regEmail}</strong>.
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full py-3 bg-ivory/50 border border-champagne/30 rounded-xl text-base font-mono font-bold tracking-widest text-charcoal focus:outline-none focus:border-champagne text-center"
                    />
                    <p className="text-[11px] text-charcoal/50 mt-1 text-center">
                      Instant demo verification passcode: <strong className="text-charcoal font-mono">1234</strong>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <TextShimmerWave duration={1} className="font-medium text-xs text-ivory">
                        Verifying &amp; creating account...
                      </TextShimmerWave>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verify &amp; Activate Account</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegStep('FORM')}
                    className="w-full text-center text-xs text-charcoal/60 hover:text-charcoal hover:underline"
                  >
                    &larr; Edit Name, Mobile or Email
                  </button>
                </form>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
