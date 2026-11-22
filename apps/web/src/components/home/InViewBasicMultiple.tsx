'use client';

import React from 'react';
import { InView } from '@/components/core/in-view';
import { ChevronDown, Sparkles } from 'lucide-react';

export function InViewBasicMultiple() {
  return (
    <div className="relative rounded-3xl border border-slate-200/80 bg-white shadow-xl overflow-hidden">
      {/* Top Header Card Bar */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Scroll-Triggered InView Demonstration
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Interactive Scroll Box</span>
        </div>
      </div>

      {/* Scrollable Container with exact InView animations */}
      <div className="h-[360px] w-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="mb-28 py-12 text-center text-xs font-semibold text-slate-400 flex flex-col items-center gap-2">
          <span>Scroll down inside this box to reveal animations</span>
          <ChevronDown className="h-4 w-4 animate-bounce text-slate-400" />
        </div>

        {/* Card 1: Athletics (Fade in + blur + scale up from bottom) */}
        <div className="flex h-[350px] items-end justify-center px-4 pb-20">
          <InView
            variants={{
              hidden: {
                opacity: 0,
                y: 30,
                scale: 0.95,
                filter: 'blur(4px)',
              },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
              },
            }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            viewOptions={{ margin: '0px 0px -20% 0px' }}
          >
            <div className="max-w-md w-full bg-slate-100 hover:bg-slate-200/70 transition-colors p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                <span>Track & Field</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                <strong className="font-bold text-slate-950">Athletics.</strong>{' '}
                Watch running, jumping, and throwing events. Athletes compete in
                many different activities.
              </p>
            </div>
          </InView>
        </div>

        {/* Card 2: Swimming (Slide in from right) */}
        <div className="flex h-[350px] items-end justify-center px-4 pb-20">
          <InView
            variants={{
              hidden: {
                opacity: 0,
                x: 100,
              },
              visible: {
                opacity: 1,
                x: 0,
              },
            }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            viewOptions={{ margin: '0px 0px -20% 0px' }}
          >
            <div className="max-w-md w-full bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                <span>Aquatics</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <strong className="font-bold text-white">Swimming.</strong>{' '}
                See swimmers race in water. They use different styles to swim fast
                and win medals.
              </p>
            </div>
          </InView>
        </div>

        {/* Card 3: Gymnastics (Scale down from 1.5x) */}
        <div className="flex h-[350px] items-end justify-center overflow-x-hidden px-4 pb-20">
          <InView
            variants={{
              hidden: {
                opacity: 0,
                scale: 1.5,
              },
              visible: {
                opacity: 1,
                scale: 1,
              },
            }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            viewOptions={{ margin: '0px 0px -20% 0px' }}
          >
            <div className="max-w-md w-full bg-slate-100 hover:bg-slate-200/70 transition-colors p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                <span>Acrobatics</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                <strong className="font-bold text-slate-950">Gymnastics.</strong> Gymnasts
                perform amazing flips and jumps. They show strength and balance in
                their routines.
              </p>
            </div>
          </InView>
        </div>

        {/* Bottom indicator */}
        <div className="py-6 text-center text-xs text-slate-400">
          End of discipline showcase
        </div>
      </div>
    </div>
  );
}

export default InViewBasicMultiple;
