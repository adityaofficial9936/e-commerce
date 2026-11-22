'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  CSSProperties,
  MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface TransitionConfig {
  duration?: number;
  ease?: string;
}

interface MorphingDialogContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRect: DOMRect | null;
  setTriggerRect: (rect: DOMRect | null) => void;
  transition: TransitionConfig;
}

const MorphingDialogContext = createContext<MorphingDialogContextType | null>(null);

export function useMorphingDialog() {
  const context = useContext(MorphingDialogContext);
  if (!context) {
    throw new Error('useMorphingDialog must be used within a MorphingDialog');
  }
  return context;
}

export interface MorphingDialogProps {
  children: ReactNode;
  transition?: TransitionConfig;
}

export function MorphingDialog({
  children,
  transition = { duration: 0.35, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
}: MorphingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  return (
    <MorphingDialogContext.Provider
      value={{
        isOpen,
        setIsOpen,
        triggerRect,
        setTriggerRect,
        transition,
      }}
    >
      {children}
    </MorphingDialogContext.Provider>
  );
}

export interface MorphingDialogTriggerProps {
  children: ReactNode;
  className?: string;
}

export function MorphingDialogTrigger({
  children,
  className = '',
}: MorphingDialogTriggerProps) {
  const { setIsOpen, setTriggerRect } = useMorphingDialog();
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerRect(rect);
    }
    setIsOpen(true);
  };

  return (
    <div
      ref={triggerRef}
      onClick={handleClick}
      className={`cursor-zoom-in ${className}`}
    >
      {children}
    </div>
  );
}

export interface MorphingDialogContainerProps {
  children: ReactNode;
}

export function MorphingDialogContainer({
  children,
}: MorphingDialogContainerProps) {
  const { isOpen, setIsOpen } = useMorphingDialog();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with fade transition */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      />
      {/* Centered Container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-8 pointer-events-none">
        <div className="pointer-events-auto max-w-full max-h-full">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export interface MorphingDialogContentProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MorphingDialogContent({
  children,
  className = '',
  style = {},
}: MorphingDialogContentProps) {
  const { triggerRect, transition } = useMorphingDialog();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Trigger transition after mount
    const timer = requestAnimationFrame(() => {
      setIsExpanded(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const duration = transition.duration ?? 0.35;
  const ease = transition.ease ?? 'cubic-bezier(0.16, 1, 0.3, 1)';

  // Morph from thumbnail coordinates to screen center
  const initialStyle: CSSProperties = triggerRect
    ? {
        transform: isExpanded ? 'translate3d(0, 0, 0) scale(1)' : 'scale(0.85)',
        opacity: isExpanded ? 1 : 0,
        transition: `transform ${duration}s ${ease}, opacity ${duration * 0.8}s ease-out`,
      }
    : {
        transform: isExpanded ? 'scale(1)' : 'scale(0.92)',
        opacity: isExpanded ? 1 : 0,
        transition: `transform ${duration}s ${ease}, opacity ${duration * 0.8}s ease-out`,
      };

  return (
    <div
      className={`relative overflow-hidden shadow-2xl ${className}`}
      style={{
        ...style,
        ...initialStyle,
      }}
    >
      {children}
    </div>
  );
}

export interface MorphingDialogImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}

export function MorphingDialogImage({
  src,
  alt,
  className = '',
  style = {},
}: MorphingDialogImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`transition-all duration-300 ${className}`}
      style={style}
    />
  );
}

export interface MorphingDialogCloseProps {
  className?: string;
  children?: ReactNode;
  variants?: any;
}

export function MorphingDialogClose({
  className = '',
  children,
}: MorphingDialogCloseProps) {
  const { setIsOpen } = useMorphingDialog();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(false);
      }}
      className={`fixed right-6 top-6 z-50 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-xl p-2 transition-transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm ${className}`}
      aria-label="Close dialog"
    >
      {children || <X className="h-5 w-5" />}
    </button>
  );
}

export default MorphingDialog;
