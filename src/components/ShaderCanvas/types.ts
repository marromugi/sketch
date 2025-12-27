import type { IUniform } from 'three';
import type * as THREE from 'three';
import type { CSSProperties } from 'react';

/**
 * Supported uniform value types in Three.js
 */
export type UniformValue =
  | number
  | number[]
  | Float32Array
  | THREE.Vector2
  | THREE.Vector3
  | THREE.Vector4
  | THREE.Matrix3
  | THREE.Matrix4
  | THREE.Color
  | THREE.Texture;

/**
 * Generic type for custom uniforms with proper typing
 */
export type CustomUniforms<T extends Record<string, UniformValue> = Record<string, UniformValue>> = {
  [K in keyof T]: IUniform<T[K]>;
};

/**
 * Size configuration options
 */
export type SizeMode =
  | { mode: 'fixed'; width: number; height: number }
  | { mode: 'fill' }
  | { mode: 'viewport' }
  | { mode: 'aspect'; aspectRatio: number; maxWidth?: number; maxHeight?: number };

/**
 * Imperative control handle (exposed via ref)
 */
export interface ShaderCanvasControls {
  play: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  updateUniform: <K extends string>(name: K, value: UniformValue) => void;
  getUniform: <K extends string>(name: K) => UniformValue | undefined;
  captureFrame: () => string;
}

/**
 * Main component props
 */
export interface ShaderCanvasProps<T extends Record<string, UniformValue> = Record<string, never>> {
  /** Fragment shader source (required) */
  fragmentShader: string;

  /** Vertex shader source (optional, uses default fullscreen quad) */
  vertexShader?: string;

  /** Custom uniforms with generic typing */
  uniforms?: CustomUniforms<T>;

  /** Size configuration */
  size?: SizeMode;

  /** Pixel ratio: number, 'device', or 'capped' (default: 'capped' at 2) */
  pixelRatio?: number | 'device' | 'capped';

  /** Auto-start animation (default: true) */
  autoPlay?: boolean;

  /** Initial time value (default: 0) */
  initialTime?: number;

  /** Playback speed multiplier (default: 1) */
  playbackSpeed?: number;

  /** Enable u_time uniform (default: true) */
  enableTimeUniform?: boolean;

  /** Enable u_resolution uniform (default: true) */
  enableResolutionUniform?: boolean;

  /** Enable u_mouse uniforms (default: true) */
  enableMouseUniform?: boolean;

  /** Enable transparent background (default: false) */
  transparent?: boolean;

  /** Enable antialiasing (default: true) */
  antialias?: boolean;

  /** Callback when controls are ready */
  onInit?: (controls: ShaderCanvasControls) => void;

  /** Callback called each frame */
  onFrame?: (time: number, deltaTime: number) => void;

  /** Callback when canvas resizes */
  onResize?: (width: number, height: number) => void;

  /** Callback on shader compilation error */
  onError?: (error: Error) => void;

  /** CSS class name */
  className?: string;

  /** Inline styles */
  style?: CSSProperties;

  /** Element ID */
  id?: string;
}
