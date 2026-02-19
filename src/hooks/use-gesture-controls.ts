import { useEffect, useRef, useCallback } from 'react';

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  initialDistance: number | null;
}

interface UseGestureControlsOptions {
  elementRef: React.RefObject<HTMLElement | null>;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
  onDoubleTap?: () => void;
  onTapLeft?: () => void;
  onTapRight?: () => void;
  onTapCenter?: () => void;
  enabled?: boolean;
  swipeThreshold?: number;
  pinchThreshold?: number;
}

function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function useGestureControls({
  elementRef,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onPinchIn,
  onPinchOut,
  onDoubleTap,
  onTapLeft,
  onTapRight,
  onTapCenter,
  enabled = true,
  swipeThreshold = 50,
  pinchThreshold = 30,
}: UseGestureControlsOptions) {
  const touchState = useRef<TouchState | null>(null);
  const lastTapTime = useRef(0);

  const callbackRefs = useRef({
    onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight,
    onPinchIn, onPinchOut, onDoubleTap,
    onTapLeft, onTapRight, onTapCenter,
  });
  callbackRefs.current = {
    onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight,
    onPinchIn, onPinchOut, onDoubleTap,
    onTapLeft, onTapRight, onTapCenter,
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      initialDistance: e.touches.length >= 2 ? getTouchDistance(e.touches) : null,
    };
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchState.current) return;
    const state = touchState.current;
    const elapsed = Date.now() - state.startTime;

    // Handle pinch
    if (state.initialDistance !== null && e.changedTouches.length >= 1) {
      // Pinch was handled in touchmove
      touchState.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Tap detection (short duration, small movement)
    if (elapsed < 300 && absDx < 15 && absDy < 15) {
      const now = Date.now();
      if (now - lastTapTime.current < 350) {
        // Double tap
        callbackRefs.current.onDoubleTap?.();
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
        // Single tap zones (left third, center third, right third)
        const el = elementRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const relX = touch.clientX - rect.left;
          const third = rect.width / 3;
          if (relX < third) {
            callbackRefs.current.onTapLeft?.();
          } else if (relX > third * 2) {
            callbackRefs.current.onTapRight?.();
          } else {
            callbackRefs.current.onTapCenter?.();
          }
        }
      }
      touchState.current = null;
      return;
    }

    // Swipe detection
    if (absDx > swipeThreshold || absDy > swipeThreshold) {
      if (absDx > absDy) {
        // Horizontal swipe
        if (dx > 0) callbackRefs.current.onSwipeRight?.();
        else callbackRefs.current.onSwipeLeft?.();
      } else {
        // Vertical swipe
        if (dy > 0) callbackRefs.current.onSwipeDown?.();
        else callbackRefs.current.onSwipeUp?.();
      }
    }

    touchState.current = null;
  }, [enabled, elementRef, swipeThreshold]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchState.current) return;

    // Pinch detection
    if (e.touches.length >= 2 && touchState.current.initialDistance !== null) {
      const currentDistance = getTouchDistance(e.touches);
      const diff = currentDistance - touchState.current.initialDistance;
      if (Math.abs(diff) > pinchThreshold) {
        if (diff > 0) callbackRefs.current.onPinchOut?.();
        else callbackRefs.current.onPinchIn?.();
        // Reset to prevent repeated triggers
        touchState.current.initialDistance = currentDistance;
      }
    }
  }, [enabled, pinchThreshold]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || !enabled) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [elementRef, enabled, handleTouchStart, handleTouchEnd, handleTouchMove]);
}
