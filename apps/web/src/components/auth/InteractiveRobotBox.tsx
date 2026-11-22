'use client';

import React, { useEffect, useRef, useState } from 'react';

interface InteractiveRobotBoxProps {
  isPasswordFocused?: boolean;
}

export function InteractiveRobotBox({ isPasswordFocused = false }: InteractiveRobotBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState({ dx: 0, dy: 0 });
  const [spotlight, setSpotlight] = useState({ x: 180, y: 180, active: false });
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized offset based on screen dimensions (-1 to 1)
      const maxDistanceX = window.innerWidth * 0.55;
      const maxDistanceY = window.innerHeight * 0.55;

      const rawDx = (e.clientX - centerX) / maxDistanceX;
      const rawDy = (e.clientY - centerY) / maxDistanceY;

      const clampedDx = Math.max(-1, Math.min(1, rawDx));
      const clampedDy = Math.max(-1, Math.min(1, rawDy));

      setOffsets({
        dx: clampedDx,
        dy: clampedDy,
      });

      // Local spotlight coordinate inside dark container
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const insideOrNear =
        localX >= -80 &&
        localX <= rect.width + 80 &&
        localY >= -80 &&
        localY <= rect.height + 80;

      setSpotlight({
        x: Math.max(0, Math.min(rect.width, localX)),
        y: Math.max(0, Math.min(rect.height, localY)),
        active: insideOrNear,
      });

      // Proximity check to robot center for glow effect (Image 3)
      const distFromCenter = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      setIsNear(distFromCenter < 140);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const { dx, dy } = offsets;

  // 3D rotations and translations
  const headRotateY = dx * 28;
  const headRotateX = -dy * 22;
  const headRotateZ = dx * 3;
  const headTranslateX = dx * 18;
  const headTranslateY = dy * 14;

  // Parallax for inner face/eye plate
  const eyeTranslateX = isPasswordFocused ? 12 : dx * 16;
  const eyeTranslateY = isPasswordFocused ? 14 : dy * 12;

  // Shadow displacement
  const shadowTranslateX = dx * 12;
  const shadowScale = 1 - Math.abs(dx) * 0.12;

  // Antenna reaction
  const antennaRotate = dx * 14;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] lg:min-h-[580px] bg-[#0A0D14] rounded-3xl overflow-hidden flex flex-col items-center justify-center select-none shadow-2xl border border-slate-800/60"
      style={{
        perspective: '1000px',
      }}
    >
      {/* Background Interactive Cursor Spotlight (Flashlight Glow) */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spotlight.active ? 1 : 0.4,
          background: `radial-gradient(circle 260px at ${spotlight.x}px ${spotlight.y}px, rgba(255, 255, 255, 0.09), transparent 70%)`,
        }}
      />

      {/* Floating 3D Robot Rig */}
      <div
        className="relative z-10 flex flex-col items-center justify-center transition-transform ease-out duration-100 will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: `translate3d(${headTranslateX}px, ${headTranslateY}px, 0px) rotateX(${headRotateX}deg) rotateY(${headRotateY}deg) rotateZ(${headRotateZ}deg)`,
        }}
      >
        {/* Robot SVG Assembly */}
        <div
          className={`relative transition-all duration-300 ${
            isNear ? 'drop-shadow-[0_0_24px_rgba(255,255,255,0.45)]' : 'drop-shadow-[0_12px_28px_rgba(0,0,0,0.8)]'
          }`}
        >
          <svg
            width="250"
            height="210"
            viewBox="0 0 250 210"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible"
          >
            {/* Filter definition for subtle cyber glow */}
            <defs>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Left Ear Lug */}
            <rect
              x="12"
              y="74"
              width="10"
              height="36"
              rx="5"
              fill="#FFFFFF"
              className="transition-transform duration-100"
              style={{
                transform: `translateX(${dx * -2}px)`,
              }}
            />

            {/* Right Ear Lug */}
            <rect
              x="228"
              y="74"
              width="10"
              height="36"
              rx="5"
              fill="#FFFFFF"
              className="transition-transform duration-100"
              style={{
                transform: `translateX(${dx * 2}px)`,
              }}
            />

            {/* Antenna with spring reaction */}
            <g
              style={{
                transformOrigin: '76px 44px',
                transform: `rotate(${antennaRotate}deg)`,
                transition: 'transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            >
              {/* Antenna joint and stem */}
              <path
                d="M74 44 L58 24 L50 26 L42 12"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Antenna tip sphere */}
              <circle
                cx="40"
                cy="9"
                r="5.5"
                fill="#FFFFFF"
                className="transition-all duration-300"
              />
            </g>

            {/* Outer Helmet Thick Chamfered Border (Solid White Frame) */}
            <path
              d="
                M 72 26
                L 178 26
                L 220 54
                L 220 130
                L 178 158
                L 72 158
                L 30 130
                L 30 54
                Z
              "
              fill="#0A0D14"
              stroke="#FFFFFF"
              strokeWidth="9"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Inner Visor / Screen Cutout (Dark Hollow) */}
            <path
              d="
                M 80 40
                L 170 40
                L 204 62
                L 204 122
                L 170 144
                L 80 144
                L 46 122
                L 46 62
                Z
              "
              fill="#0F1420"
              stroke="#1E2536"
              strokeWidth="2"
            />

            {/* Interactive Eye / Face Plate with Parallax Depth */}
            <g
              className="transition-transform ease-out duration-100"
              style={{
                transform: `translate(${eyeTranslateX}px, ${eyeTranslateY}px)`,
              }}
            >
              {/* White Cyber Face Badge */}
              <rect
                x="88"
                y="64"
                width="74"
                height="56"
                rx="14"
                fill="#FFFFFF"
              />

              {/* Left Eye: Geometric 'X' Mark */}
              <g stroke="#0A0D14" strokeWidth="3.8" strokeLinecap="round">
                <line x1="110" y1="84" x2="124" y2="98" />
                <line x1="124" y1="84" x2="110" y2="98" />
              </g>

              {/* Right Eye: Square Pixel / Slit Notch */}
              <rect
                x="138"
                y="88"
                width="7"
                height="7"
                rx="1.5"
                fill="#0A0D14"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Floating Oval Shadow (shifts realistically underneath) */}
      <div
        className="relative mt-8 w-36 h-7 rounded-[100%] bg-black/60 blur-md transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translateX(${shadowTranslateX}px) scaleX(${shadowScale})`,
          opacity: Math.max(0.25, 0.55 - Math.abs(dy) * 0.15),
        }}
      />

      {/* Status Pill Indicator */}
      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Apex AI Bot • Interactive Eye Tracking
        </span>
        <span className="font-mono text-slate-600">v2.4</span>
      </div>
    </div>
  );
}
