'use client';

import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  CSSProperties,
  ElementType,
} from 'react';

export interface InViewVariant {
  opacity?: number;
  x?: number | string;
  y?: number | string;
  scale?: number;
  filter?: string;
  rotate?: number | string;
  [key: string]: any;
}

export interface InViewVariants {
  hidden: InViewVariant;
  visible: InViewVariant;
}

export interface InViewTransition {
  duration?: number;
  delay?: number;
  ease?: string;
}

export interface InViewProps {
  children: ReactNode;
  variants?: InViewVariants;
  transition?: InViewTransition;
  viewOptions?: {
    margin?: string;
    rootMargin?: string;
    once?: boolean;
    amount?: number | 'some' | 'all';
    root?: Element | Document | null;
  };
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_VARIANTS: InViewVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.96,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
  },
};

const DEFAULT_TRANSITION: InViewTransition = {
  duration: 0.4,
  delay: 0,
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

function parseEase(ease?: string): string {
  if (!ease) return 'cubic-bezier(0.16, 1, 0.3, 1)';
  if (ease === 'easeInOut') return 'cubic-bezier(0.4, 0, 0.2, 1)';
  if (ease === 'easeOut') return 'cubic-bezier(0, 0, 0.2, 1)';
  if (ease === 'easeIn') return 'cubic-bezier(0.4, 0, 1, 1)';
  if (ease === 'linear') return 'linear';
  return ease;
}

function variantToCSS(variant: InViewVariant): CSSProperties {
  const {
    opacity,
    x = 0,
    y = 0,
    scale = 1,
    rotate = 0,
    filter,
    ...rest
  } = variant;

  const transformParts: string[] = [];

  const xStr = typeof x === 'number' ? `${x}px` : x;
  const yStr = typeof y === 'number' ? `${y}px` : y;
  if (x !== 0 || y !== 0) {
    transformParts.push(`translate3d(${xStr}, ${yStr}, 0)`);
  }

  if (scale !== 1) {
    transformParts.push(`scale(${scale})`);
  }

  if (rotate !== 0) {
    const rotStr = typeof rotate === 'number' ? `${rotate}deg` : rotate;
    transformParts.push(`rotate(${rotStr})`);
  }

  const cssStyle: CSSProperties = {
    ...rest,
    opacity: opacity !== undefined ? opacity : 1,
    transform: transformParts.length > 0 ? transformParts.join(' ') : 'none',
    WebkitTransform: transformParts.length > 0 ? transformParts.join(' ') : 'none',
  };

  if (filter) {
    cssStyle.filter = filter;
    cssStyle.WebkitFilter = filter;
  }

  return cssStyle;
}

export function InView({
  children,
  variants = DEFAULT_VARIANTS,
  transition = DEFAULT_TRANSITION,
  viewOptions,
  as: Component = 'div',
  className = '',
  style = {},
}: InViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const once = viewOptions?.once ?? false;
  const rootMargin = viewOptions?.margin || viewOptions?.rootMargin || '0px';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Detect scroll container if inside an overflow container, else viewport
    let scrollRoot: Element | null = viewOptions?.root as Element || null;
    if (!scrollRoot) {
      let parent = el.parentElement;
      while (parent) {
        const overflow = window.getComputedStyle(parent).overflowY;
        if (overflow === 'auto' || overflow === 'scroll') {
          scrollRoot = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }

    const threshold =
      viewOptions?.amount === 'all'
        ? 0.9
        : viewOptions?.amount === 'some'
        ? 0.05
        : typeof viewOptions?.amount === 'number'
        ? viewOptions.amount
        : 0.1;

    // If margin has negative values exceeding small containers, safely fallback
    let safeMargin = rootMargin;
    if (scrollRoot && safeMargin.includes('-350px') && scrollRoot.clientHeight < 400) {
      safeMargin = '0px 0px -10% 0px';
    }

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const inView = entry.isIntersecting;
          if (inView) {
            setIsInView(true);
            setHasEntered(true);
            if (once) {
              observer.unobserve(el);
            }
          } else if (!once) {
            setIsInView(false);
          }
        },
        {
          root: scrollRoot,
          rootMargin: safeMargin,
          threshold,
        }
      );

      observer.observe(el);
      return () => observer.disconnect();
    } catch {
      // Fallback: show content if IntersectionObserver option is rejected
      setIsInView(true);
    }
  }, [rootMargin, once, viewOptions?.amount, viewOptions?.root]);

  const activeVariant = isInView || (once && hasEntered) ? variants.visible : variants.hidden;
  const targetCSS = variantToCSS(activeVariant);

  const transitionDuration = transition.duration ?? 0.4;
  const transitionDelay = transition.delay ?? 0;
  const transitionEase = parseEase(transition.ease);

  const mergedStyle: CSSProperties = {
    ...style,
    ...targetCSS,
    transition: `transform ${transitionDuration}s ${transitionEase} ${transitionDelay}s, opacity ${transitionDuration}s ${transitionEase} ${transitionDelay}s, filter ${transitionDuration}s ${transitionEase} ${transitionDelay}s`,
    willChange: 'transform, opacity, filter',
  };

  return (
    <Component ref={ref} className={className} style={mergedStyle}>
      {children}
    </Component>
  );
}

export default InView;
