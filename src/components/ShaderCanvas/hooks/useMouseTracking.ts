import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';

interface UseMouseTrackingResult {
  mousePosition: THREE.Vector2;
  mouseNormalized: THREE.Vector2;
}

export function useMouseTracking(
  containerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean
): UseMouseTrackingResult {
  const mousePosition = useRef(new THREE.Vector2(0, 0));
  const mouseNormalized = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      mousePosition.current.set(x, rect.height - y);
      mouseNormalized.current.set(x / rect.width, 1 - y / rect.height);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;

      const touch = event.touches[0];
      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      mousePosition.current.set(x, rect.height - y);
      mouseNormalized.current.set(x / rect.width, 1 - y / rect.height);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [containerRef, enabled]);

  return {
    mousePosition: mousePosition.current,
    mouseNormalized: mouseNormalized.current,
  };
}
