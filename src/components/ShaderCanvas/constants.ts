/**
 * Default fullscreen vertex shader
 * Creates a plane that fills the entire viewport
 */
export const DEFAULT_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Fallback fragment shader (magenta = error indicator)
 */
export const FALLBACK_FRAGMENT_SHADER = `
varying vec2 vUv;

void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
`;

/**
 * Simple test fragment shader with animated colors
 */
export const TEST_FRAGMENT_SHADER = `
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 col = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}
`;
