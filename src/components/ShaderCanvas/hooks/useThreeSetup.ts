import { useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';

interface UseThreeSetupOptions {
  transparent?: boolean;
  antialias?: boolean;
  pixelRatio: number;
}

interface UseThreeSetupResult {
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  sceneRef: RefObject<THREE.Scene | null>;
  cameraRef: RefObject<THREE.OrthographicCamera | null>;
  meshRef: RefObject<THREE.Mesh | null>;
  isReady: boolean;
}

export function useThreeSetup(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseThreeSetupOptions
): UseThreeSetupResult {
  const { transparent = false, antialias = true, pixelRatio } = options;

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias,
      alpha: transparent,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(pixelRatio);
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create orthographic camera for 2D shader work
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    // Create fullscreen plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    geometryRef.current = geometry;

    // Create mesh (material will be set by useShaderMaterial)
    const mesh = new THREE.Mesh(geometry);
    meshRef.current = mesh;
    scene.add(mesh);

    // Append canvas to container
    container.appendChild(renderer.domElement);

    setIsReady(true);

    // Cleanup
    return () => {
      setIsReady(false);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      geometry.dispose();
      renderer.dispose();

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      meshRef.current = null;
      geometryRef.current = null;
    };
  }, [transparent, antialias, pixelRatio]);

  return {
    rendererRef,
    sceneRef,
    cameraRef,
    meshRef,
    isReady,
  };
}
