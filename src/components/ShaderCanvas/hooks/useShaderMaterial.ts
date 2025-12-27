import { useEffect, useRef, useCallback, type RefObject } from 'react';
import * as THREE from 'three';
import type { IUniform } from 'three';
import type { UniformValue, CustomUniforms } from '../types';

interface UseShaderMaterialOptions {
  enableTime: boolean;
  enableResolution: boolean;
  enableMouse: boolean;
}

interface UseShaderMaterialResult {
  materialRef: RefObject<THREE.ShaderMaterial | null>;
  uniforms: Record<string, IUniform>;
  updateUniform: (name: string, value: UniformValue) => void;
  getUniform: (name: string) => UniformValue | undefined;
}

export function useShaderMaterial<T extends Record<string, UniformValue>>(
  meshRef: RefObject<THREE.Mesh | null>,
  fragmentShader: string,
  vertexShader: string,
  isReady: boolean,
  customUniforms?: CustomUniforms<T>,
  options?: UseShaderMaterialOptions
): UseShaderMaterialResult {
  const { enableTime = true, enableResolution = true, enableMouse = true } = options || {};

  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const uniformsRef = useRef<Record<string, IUniform>>({});

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !isReady) return;

    // Build uniforms
    const uniforms: Record<string, IUniform> = {};

    if (enableTime) {
      uniforms.u_time = { value: 0 };
    }

    if (enableResolution) {
      uniforms.u_resolution = { value: new THREE.Vector2(1, 1) };
    }

    if (enableMouse) {
      uniforms.u_mouse = { value: new THREE.Vector2(0, 0) };
      uniforms.u_mouseNormalized = { value: new THREE.Vector2(0, 0) };
    }

    // Merge custom uniforms
    if (customUniforms) {
      for (const key in customUniforms) {
        uniforms[key] = { value: customUniforms[key].value };
      }
    }

    uniformsRef.current = uniforms;

    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    materialRef.current = material;
    mesh.material = material;

    // Cleanup
    return () => {
      material.dispose();
      materialRef.current = null;
    };
  }, [meshRef, fragmentShader, vertexShader, isReady, enableTime, enableResolution, enableMouse]);

  // Update custom uniforms when they change
  useEffect(() => {
    const material = materialRef.current;
    if (!material || !customUniforms) return;

    for (const key in customUniforms) {
      if (material.uniforms[key]) {
        material.uniforms[key].value = customUniforms[key].value;
      }
    }
  }, [customUniforms]);

  const updateUniform = useCallback((name: string, value: UniformValue) => {
    const material = materialRef.current;
    if (material && material.uniforms[name]) {
      material.uniforms[name].value = value;
    }
  }, []);

  const getUniform = useCallback((name: string): UniformValue | undefined => {
    const material = materialRef.current;
    if (material && material.uniforms[name]) {
      return material.uniforms[name].value as UniformValue;
    }
    return undefined;
  }, []);

  return {
    materialRef,
    uniforms: uniformsRef.current,
    updateUniform,
    getUniform,
  };
}
