import { useRef, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef, type ForwardedRef, type CSSProperties } from 'react';
import * as THREE from 'three';
import type { IUniform } from 'three';
import type { UniformValue, ShaderCanvasProps, ShaderCanvasControls, SizeMode } from './types';
import { DEFAULT_VERTEX_SHADER } from './constants';

function getContainerStyle(sizeMode: SizeMode): CSSProperties {
  switch (sizeMode.mode) {
    case 'fixed':
      return { width: sizeMode.width, height: sizeMode.height };
    case 'viewport':
      return { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' };
    case 'aspect':
      return { width: '100%', maxWidth: sizeMode.maxWidth, aspectRatio: sizeMode.aspectRatio };
    case 'fill':
    default:
      return { width: '100%', height: '100%' };
  }
}

function ShaderCanvasInner<T extends Record<string, UniformValue> = Record<string, never>>(
  props: ShaderCanvasProps<T>,
  ref: ForwardedRef<ShaderCanvasControls>
) {
  const {
    fragmentShader,
    vertexShader = DEFAULT_VERTEX_SHADER,
    uniforms: customUniforms,
    size = { mode: 'fill' },
    pixelRatio = 'capped',
    autoPlay = true,
    initialTime = 0,
    playbackSpeed = 1,
    enableTimeUniform = true,
    enableResolutionUniform = true,
    enableMouseUniform = true,
    transparent = false,
    antialias = true,
    onFrame,
    onResize,
    className,
    style,
    id,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const rafIdRef = useRef<number | null>(null);
  const timeRef = useRef(initialTime);
  const isPlayingRef = useRef(autoPlay);
  const lastTimestampRef = useRef<number | null>(null);
  const playbackSpeedRef = useRef(playbackSpeed);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const mouseNormalizedRef = useRef(new THREE.Vector2(0, 0));
  const sizeRef = useRef({ width: 1, height: 1 });

  const actualPixelRatio = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    if (pixelRatio === 'device') return window.devicePixelRatio;
    if (pixelRatio === 'capped') return Math.min(window.devicePixelRatio, 2);
    return pixelRatio;
  }, [pixelRatio]);

  // Main setup effect
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
    renderer.setPixelRatio(actualPixelRatio);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    // Create geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Build uniforms
    const uniforms: Record<string, IUniform> = {};
    if (enableTimeUniform) uniforms.u_time = { value: 0 };
    if (enableResolutionUniform) uniforms.u_resolution = { value: new THREE.Vector2(1, 1) };
    if (enableMouseUniform) {
      uniforms.u_mouse = { value: new THREE.Vector2(0, 0) };
      uniforms.u_mouseNormalized = { value: new THREE.Vector2(0, 0) };
    }
    if (customUniforms) {
      for (const key in customUniforms) {
        uniforms[key] = { value: customUniforms[key].value };
      }
    }

    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    materialRef.current = material;

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);

    // Set initial size
    const updateSize = () => {
      let width: number, height: number;
      if (size.mode === 'viewport') {
        width = window.innerWidth;
        height = window.innerHeight;
      } else if (size.mode === 'fixed') {
        width = size.width;
        height = size.height;
      } else {
        width = container.clientWidth || 300;
        height = container.clientHeight || 150;
      }
      renderer.setSize(width, height);
      sizeRef.current = { width: width * actualPixelRatio, height: height * actualPixelRatio };
      if (material.uniforms.u_resolution) {
        material.uniforms.u_resolution.value.set(sizeRef.current.width, sizeRef.current.height);
      }
      onResize?.(width, height);
    };
    updateSize();

    // Animation loop
    const animate = (timestamp: number) => {
      if (!isPlayingRef.current) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimestampRef.current;
      const deltaTime = (deltaMs / 1000) * playbackSpeedRef.current;
      lastTimestampRef.current = timestamp;
      timeRef.current += deltaTime;

      // Update uniforms
      if (material.uniforms.u_time) {
        material.uniforms.u_time.value = timeRef.current;
      }
      if (material.uniforms.u_mouse) {
        material.uniforms.u_mouse.value.copy(mouseRef.current);
      }
      if (material.uniforms.u_mouseNormalized) {
        material.uniforms.u_mouseNormalized.value.copy(mouseNormalizedRef.current);
      }

      onFrame?.(timeRef.current, deltaTime);
      renderer.render(scene, camera);
      rafIdRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    if (autoPlay) {
      isPlayingRef.current = true;
      rafIdRef.current = requestAnimationFrame(animate);
    } else {
      renderer.render(scene, camera);
    }

    // Mouse tracking
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      mouseRef.current.set(x, rect.height - y);
      mouseNormalizedRef.current.set(x / rect.width, 1 - y / rect.height);
    };

    // Resize handling
    const handleResize = () => updateSize();

    if (enableMouseUniform) {
      container.addEventListener('mousemove', handleMouseMove);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (enableMouseUniform) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', handleResize);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      materialRef.current = null;
      meshRef.current = null;
    };
  }, [fragmentShader, vertexShader, transparent, antialias, actualPixelRatio, size, enableTimeUniform, enableResolutionUniform, enableMouseUniform, autoPlay]);

  // Control functions
  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    lastTimestampRef.current = null;

    const animate = (timestamp: number) => {
      if (!isPlayingRef.current) return;

      const material = materialRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      if (!material || !renderer || !scene || !camera) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimestampRef.current;
      const deltaTime = (deltaMs / 1000) * playbackSpeedRef.current;
      lastTimestampRef.current = timestamp;
      timeRef.current += deltaTime;

      if (material.uniforms.u_time) {
        material.uniforms.u_time.value = timeRef.current;
      }

      onFrame?.(timeRef.current, deltaTime);
      renderer.render(scene, camera);
      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
  }, [onFrame]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    timeRef.current = initialTime;
    lastTimestampRef.current = null;
    const material = materialRef.current;
    if (material?.uniforms.u_time) {
      material.uniforms.u_time.value = initialTime;
    }
  }, [initialTime]);

  const setTime = useCallback((time: number) => {
    timeRef.current = time;
    const material = materialRef.current;
    if (material?.uniforms.u_time) {
      material.uniforms.u_time.value = time;
    }
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    playbackSpeedRef.current = speed;
  }, []);

  const updateUniform = useCallback((name: string, value: UniformValue) => {
    const material = materialRef.current;
    if (material?.uniforms[name]) {
      material.uniforms[name].value = value;
    }
  }, []);

  const getUniform = useCallback((name: string): UniformValue | undefined => {
    const material = materialRef.current;
    return material?.uniforms[name]?.value as UniformValue | undefined;
  }, []);

  const captureFrame = useCallback(() => {
    return rendererRef.current?.domElement.toDataURL('image/png') ?? '';
  }, []);

  const controls: ShaderCanvasControls = useMemo(() => ({
    play,
    pause,
    reset,
    setTime,
    setPlaybackSpeed,
    updateUniform,
    getUniform,
    captureFrame,
  }), [play, pause, reset, setTime, setPlaybackSpeed, updateUniform, getUniform, captureFrame]);

  useImperativeHandle(ref, () => controls, [controls]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={{
        ...getContainerStyle(size),
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}

export const ShaderCanvas = forwardRef(ShaderCanvasInner) as <
  T extends Record<string, UniformValue> = Record<string, never>,
>(
  props: ShaderCanvasProps<T> & { ref?: ForwardedRef<ShaderCanvasControls> }
) => JSX.Element;
