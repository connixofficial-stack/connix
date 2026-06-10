'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Hàm parse số từ string, lấy phần số đầu tiên
const parseNumber = (value: string): number => {
  const match = value.match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

// Hàm format lại số với phần còn lại
const formatWithSuffix = (currentValue: number, originalValue: string): string => {
  const numPart = parseNumber(originalValue);
  if (numPart === 0) return originalValue;
  
  const suffix = originalValue.replace(/^(\d+(?:\.\d+)?)/, '');
  return Math.round(currentValue).toString() + suffix;
};

export const useCountAnimation = (
  targetValue: string,
  enabled: boolean = true,
  duration: number = 2000
) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const animationRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Animation function
  const startAnimation = useCallback(() => {
    if (!mountedRef.current || isAnimating || hasTriggered) return;
    
    const targetNumber = parseNumber(targetValue);
    if (targetNumber === 0) {
      setDisplayValue(targetValue);
      return;
    }

    console.log('🎬 Starting animation:', targetValue, '→', targetNumber);
    setIsAnimating(true);
    setHasTriggered(true);
    
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      if (!mountedRef.current) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      };
      
      const easedProgress = easeInOutCubic(progress);
      const currentValue = startValue + (targetNumber - startValue) * easedProgress;
      
      const newDisplayValue = formatWithSuffix(currentValue, targetValue);
      setDisplayValue(newDisplayValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        setIsAnimating(false);
        console.log('✅ Animation completed:', targetValue);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [targetValue, duration, isAnimating, hasTriggered]);

  // Setup intersection observer
  useEffect(() => {
    if (!enabled) {
      setDisplayValue(targetValue);
      setHasTriggered(false);
      setIsAnimating(false);
      return;
    }

    // Always start with 0 when enabled
    if (!hasTriggered) {
      setDisplayValue('0');
    }

    const element = elementRef.current;
    if (!element) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Check if in preview mode
    const isInPreview = element.closest('[class*="preview"]') || 
                       element.closest('[class*="Preview"]') ||
                       element.closest('[data-preview]');
    
    if (isInPreview) {
      console.log('📱 Preview mode detected, starting animation immediately');
      // Small delay for preview to ensure DOM is ready
      setTimeout(() => {
        if (mountedRef.current && !hasTriggered) {
          startAnimation();
        }
      }, 200);
      return;
    }

    // For site pages, use intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log('👁️ Intersection:', {
          isIntersecting: entry.isIntersecting,
          ratio: entry.intersectionRatio,
          hasTriggered,
          enabled
        });
        
        if (entry.isIntersecting && !hasTriggered && enabled && mountedRef.current) {
          // Small delay to ensure smooth animation start
          setTimeout(() => {
            if (mountedRef.current && !hasTriggered) {
              startAnimation();
            }
          }, 100);
        }
      },
      {
        threshold: [0, 0.1, 0.25],
        rootMargin: '50px 0px -20px 0px'
      }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasTriggered, startAnimation]);

  // Reset when enabled changes
  useEffect(() => {
    if (enabled) {
      setHasTriggered(false);
      setIsAnimating(false);
      setDisplayValue('0');
    } else {
      setDisplayValue(targetValue);
      setHasTriggered(false);
      setIsAnimating(false);
    }
  }, [enabled, targetValue]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    displayValue,
    elementRef
  };
};