'use client';

import React from 'react';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogImage,
  MorphingDialogContainer,
} from '@/components/core/morphing-dialog';
import { X as XIcon, ZoomIn } from 'lucide-react';

export function MorphingDialogBasicImage() {
  return (
    <MorphingDialog
      transition={{
        duration: 0.35,
        ease: 'easeInOut',
      }}
    >
      <MorphingDialogTrigger className="relative group inline-block overflow-hidden rounded-2xl shadow-md border border-slate-200">
        <MorphingDialogImage
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=85"
          alt="Air Velocity Pro Running Sneakers Hero"
          className="max-w-xs sm:max-w-sm rounded-2xl object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="p-3 bg-white/90 backdrop-blur-sm rounded-full text-slate-900 shadow-lg">
            <ZoomIn className="h-5 w-5" />
          </span>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800">
          <MorphingDialogImage
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&auto=format&fit=crop&q=90"
            alt="Air Velocity Pro Running Sneakers Fullscreen Inspection"
            className="h-auto w-full max-w-[92vw] lg:max-w-[75vw] max-h-[85vh] object-contain rounded-2xl"
          />
        </MorphingDialogContent>
        <MorphingDialogClose className="fixed right-6 top-6 h-fit w-fit rounded-full bg-white p-2 text-slate-800 shadow-2xl">
          <XIcon className="h-5 w-5 text-zinc-700" />
        </MorphingDialogClose>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}

export default MorphingDialogBasicImage;
