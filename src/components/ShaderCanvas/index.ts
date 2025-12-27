// Main component
export { ShaderCanvas } from './ShaderCanvas';

// Types
export type {
  UniformValue,
  CustomUniforms,
  SizeMode,
  ShaderCanvasControls,
  ShaderCanvasProps,
} from './types';

// Constants
export { DEFAULT_VERTEX_SHADER, FALLBACK_FRAGMENT_SHADER, TEST_FRAGMENT_SHADER } from './constants';

// Utility helpers
export {
  createUniform,
  createUniforms,
  vec2,
  vec3,
  vec4,
  color,
  float,
  array,
} from './utils';

// Hooks (for advanced usage)
export {
  useThreeSetup,
  useShaderMaterial,
  useAnimationLoop,
  useMouseTracking,
  useResizeObserver,
} from './hooks';
