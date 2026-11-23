'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Package,
  Heart,
  LogOut,
  ArrowLeft,
  Sparkles,
  Save,
  MessageCircle,
} from 'lucide-react';

export default function CustomerProfilePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vip, setVip] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('moonlet_customer_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        setName(parsed.name || '');
        setEmail(parsed.email || '');
        setPhone(parsed.phone || '+91 99367 06276');
        setVip(parsed.vip !== false);
      } else {
        // Default guest/demo profile
        setName('Aditya Yadav');
        setEmail('aditya@moonlet.in');
        setPhone('+91 99367 06276');
      }
    } catch {}
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      vip,
      welcomeRewardApplied: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('moonlet_customer_auth', JSON.stringify(updatedProfile));

      // Also update in registered customer list for admin synchronization
      const existingRaw = localStorage.getItem('moonlet_registered_customers');
      if (existingRaw) {
        const list = JSON.parse(existingRaw);
        const updatedList = list.map((c: any) =>
          c.email === email || c.phone === phone
            ? { ...c, name: name.trim(), phone: phone.trim() }
            : c
        );
        localStorage.setItem('moonlet_registered_customers', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }

    setIsSaved(true);
    setToastMessage('Profile settings saved successfully!');
    setTimeout(() => {
      setIsSaved(false);
      setToastMessage(null);
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('moonlet_customer_auth');
    localStorage.removeItem('moonlet_customer_token');
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-charcoal font-sans py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal/60 hover:text-champagne transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Orders</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs text-rose hover:text-rose/80 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center max-w-lg mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-champagne/15 border border-champagne/30 text-champagne-dark text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-champagne-dark fill-champagne-dark" />
            <span>Account Profile &amp; Settings</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-wide">
            Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-charcoal/70">
            Manage your personal contact details, verified mobile &amp; email credentials.
          </p>
        </div>

        {/* Success Toast */}
        {toastMessage && (
          <div className="p-4 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Quick Profile Card */}
          <div className="md:col-span-4 bg-white rounded-3xl border border-champagne/25 p-6 shadow-xs space-y-5 text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-blush/40 border-2 border-champagne/40 mx-auto flex items-center justify-center font-serif text-2xl font-bold text-champagne-dark">
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute bottom-0 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white" title="Verified Account">
                <ShieldCheck className="h-3 w-3" />
              </span>
            </div>

            <div>
              <h2 className="font-serif text-lg font-bold text-charcoal">{name || 'Customer'}</h2>
              <p className="text-xs text-charcoal/60 mt-0.5">{phone || email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-champagne/15 text-champagne-dark text-[11px] font-bold">
                <Sparkles className="h-3 w-3 fill-champagne" />
                <span>Moonlet VIP Member</span>
              </div>
            </div>

            <div className="pt-4 border-t border-champagne/15 space-y-2 text-xs font-semibold text-left">
              <Link
                href="/account/orders"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-blush/30 text-charcoal transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 text-champagne" />
                  <span>My Orders</span>
                </div>
                <span className="text-charcoal/40 text-[11px]">View &rarr;</span>
              </Link>

              <Link
                href="/wishlist"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-blush/30 text-charcoal transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4 text-rose" />
                  <span>My Wishlist</span>
                </div>
                <span className="text-charcoal/40 text-[11px]">View &rarr;</span>
              </Link>

              <a
                href="https://wa.me/917309936559?text=Hi%20Moonlet%20Concierge%2C%20I%20need%20support%20with%20my%20profile%20or%20orders."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>Contact Stylist</span>
                </div>
                <span className="text-emerald-500 text-[11px]">WhatsApp &rarr;</span>
              </a>
            </div>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="md:col-span-8 bg-white rounded-3xl border border-champagne/25 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">Edit Profile Information</h3>
              <p className="text-xs text-charcoal/60 mt-1">
                Keep your mobile phone and delivery notifications up-to-date.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-charcoal mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-charcoal/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-champagne/30 rounded-xl text-xs text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-champagne"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-charcoal">Mobile Phone Number</label>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Mobile (OTP Enabled)
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-charcoal/40" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-champagne/30 rounded-xl text-xs text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-champagne font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-charcoal">Email Address</label>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Email
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-charcoal/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-champagne/30 rounded-xl text-xs text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-champagne"
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-champagne/20 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-charcoal hover:bg-champagne-dark text-ivory text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4 text-champagne" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
