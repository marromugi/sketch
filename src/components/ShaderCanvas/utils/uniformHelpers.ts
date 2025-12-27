import * as THREE from 'three';
import type { IUniform } from 'three';
import type { UniformValue } from '../types';

/**
 * Creates a typed uniform object
 */
export function createUniform<T extends UniformValue>(value: T): IUniform<T> {
  return { value };
}

/**
 * Creates multiple uniforms from a plain object
 */
export function createUniforms<T extends Record<string, UniformValue>>(
  values: T
): { [K in keyof T]: IUniform<T[K]> } {
  const uniforms = {} as { [K in keyof T]: IUniform<T[K]> };
  for (const key in values) {
    uniforms[key] = { value: values[key] };
  }
  return uniforms;
}

/**
 * Creates a Vector2 uniform
 */
export function vec2(x: number = 0, y: number = 0): IUniform<THREE.Vector2> {
  return { value: new THREE.Vector2(x, y) };
}

/**
 * Creates a Vector3 uniform
 */
export function vec3(x: number = 0, y: number = 0, z: number = 0): IUniform<THREE.Vector3> {
  return { value: new THREE.Vector3(x, y, z) };
}

/**
 * Creates a Vector4 uniform
 */
export function vec4(
  x: number = 0,
  y: number = 0,
  z: number = 0,
  w: number = 0
): IUniform<THREE.Vector4> {
  return { value: new THREE.Vector4(x, y, z, w) };
}

/**
 * Creates a Color uniform from hex value or string
 */
export function color(hex: number | string): IUniform<THREE.Color> {
  return { value: new THREE.Color(hex) };
}

/**
 * Creates a float uniform
 */
export function float(value: number): IUniform<number> {
  return { value };
}

/**
 * Creates an array uniform
 */
export function array(values: number[]): IUniform<number[]> {
  return { value: values };
}
