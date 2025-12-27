import { useEffect, useState, type RefObject } from 'react';
import type * as THREE from 'three';
import type { SizeMode } from '../types';

interface UseResizeObserverOptions {
  pixelRatio: number;
  onResize?: (width: number, height: number) => void;
}

interface UseResizeObserverResult {
  width: number;
  height: number;
}

export function useResizeObserver(
  containerRef: RefObject<HTMLDivElement | null>,
  rendererRef: RefObject<THREE.WebGLRenderer | null>,
  sizeMode: SizeMode,
  options: UseResizeObserverOptions
): UseResizeObserverResult {
  const { pixelRatio, onResize } = options;

  const [size, setSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    if (!container || !renderer) return;

    const updateSize = (width: number, height: number) => {
      renderer.setSize(width, height);
      setSize({ width: width * pixelRatio, height: height * pixelRatio });
      onResize?.(width, height);
    };

    const calculateSize = (): { width: number; height: number } => {
      switch (sizeMode.mode) {
        case 'fixed':
          return { width: sizeMode.width, height: sizeMode.height };

        case 'viewport':
          return { width: window.innerWidth, height: window.innerHeight };

        case 'aspect': {
          const containerWidth = container.clientWidth || window.innerWidth;
          const containerHeight = container.clientHeight || window.innerHeight;
          let width = containerWidth;
          let height = width / sizeMode.aspectRatio;

          if (height > containerHeight) {
            height = containerHeight;
            width = height * sizeMode.aspectRatio;
          }

          if (sizeMode.maxWidth && width > sizeMode.maxWidth) {
            width = sizeMode.maxWidth;
            height = width / sizeMode.aspectRatio;
          }

          if (sizeMode.maxHeight && height > sizeMode.maxHeight) {
            height = sizeMode.maxHeight;
            width = height * sizeMode.aspectRatio;
          }

          return { width, height };
        }

        case 'fill':
        default:
          return {
            width: container.clientWidth || 300,
            height: container.clientHeight || 150,
          };
      }
    };

    // Initial size
    const initialSize = calculateSize();
    updateSize(initialSize.width, initialSize.height);

    // Handle viewport mode with window resize
    if (sizeMode.mode === 'viewport') {
      const handleWindowResize = () => {
        updateSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleWindowResize);
      return () => window.removeEventListener('resize', handleWindowResize);
    }

    // Handle other modes with ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      const newSize = calculateSize();
      updateSize(newSize.width, newSize.height);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, rendererRef, sizeMode, pixelRatio, onResize]);

  return size;
}
