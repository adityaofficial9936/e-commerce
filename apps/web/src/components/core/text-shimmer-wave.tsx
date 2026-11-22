'use client';

import React, { FC, ReactNode, useMemo } from 'react';

export interface TextShimmerWaveProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  zDistance?: number;
  xDistance?: number;
  yDistance?: number;
  spread?: number;
  scaleDistance?: number;
  rotateYDistance?: number;
}

export function TextShimmerWave({
  children,
  as: Component = 'p',
  className = '',
  duration = 1.2,
  zDistance = 10,
  xDistance = 0,
  yDistance = -2.5,
  spread = 1,
  scaleDistance = 1.08,
  rotateYDistance = 0,
}: TextShimmerWaveProps) {
  const characters = useMemo(() => Array.from(children), [children]);
  const totalLength = characters.length;

  return (
    <Component
      className={`inline-flex flex-wrap items-center select-none ${className}`}
      style={
        {
          '--duration': `${duration}s`,
        } as React.CSSProperties
      }
    >
      <style jsx>{`
        @keyframes shimmer-wave-motion {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.55;
            color: inherit;
            filter: blur(0px);
          }
          35% {
            transform: translate3d(
                ${xDistance}px,
                ${yDistance}px,
                ${zDistance}px
              )
              scale(${scaleDistance})
              rotateY(${rotateYDistance}deg);
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.45));
          }
          70% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.65;
          }
        }

        .shimmer-char {
          display: inline-block;
          will-change: transform, opacity, filter;
          animation: shimmer-wave-motion var(--duration) ease-in-out infinite;
        }

        .shimmer-space {
          display: inline-block;
          width: 0.28em;
        }
      `}</style>

      {characters.map((char, i) => {
        if (char === ' ') {
          return <span key={i} className="shimmer-space" />;
        }

        // Delay staggered smoothly across the string
        const delay = (i / Math.max(1, totalLength)) * duration * spread;

        return (
          <span
            key={i}
            className="shimmer-char"
            style={{
              animationDelay: `${delay}s`,
            }}
          >
            {char}
          </span>
        );
      })}
    </Component>
  );
}

export default TextShimmerWave;
