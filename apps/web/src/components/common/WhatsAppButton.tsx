'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppButton({
  phoneNumber = '917309936559',
  defaultMessage = 'Hello Moonlet Concierge! I need styling advice / order support.',
}: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const encodedMsg = encodeURIComponent(defaultMessage);
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMsg}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Tooltip Card / Bubble */}
      {isOpen && (
        <div className="mb-3 w-72 bg-white rounded-2xl shadow-2xl border border-champagne/30 p-4 transition-all animate-in fade-in slide-in-from-bottom-2 text-charcoal font-sans">
          <div className="flex items-start justify-between pb-2 border-b border-champagne/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold text-charcoal">Moonlet Concierge</h4>
                <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online | Typically replies in 2m
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-charcoal/40 hover:text-charcoal rounded-full"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-xs text-charcoal/70 my-3 leading-relaxed">
            Need help choosing between 18k gold-tone finishes, ring sizing, or order tracking? Chat directly with our personal jewelry stylists!
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
          >
            <MessageCircle className="h-4 w-4 fill-white text-[#25D366]" />
            <span>Start WhatsApp Chat</span>
          </a>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Chat on WhatsApp"
          className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 relative"
        >
          {/* Pulsing halo */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />
          <MessageCircle className="h-7 w-7 text-white fill-white relative z-10" />
        </button>

        {/* Hover Pill Label */}
        {!isOpen && (
          <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-charcoal text-ivory text-xs px-3 py-1.5 rounded-full whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:inline-block">
            Chat on WhatsApp
          </span>
        )}
      </div>
    </div>
  );
}
