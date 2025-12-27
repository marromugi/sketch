/**
 * Hex カラーコードを u カラー値（0.0〜1.0）に変換するユーティリティ
 */

/**
 * Hex カラーコードを RGB の u 値配列に変換
 * @param hex - Hex カラーコード（例: "#FF9800", "FF9800", "#F98", "F98"）
 * @returns [r, g, b] の配列（各値は 0.0〜1.0）
 */
export function hexToU(hex: string): [number, number, number] {
  // # を除去
  let h = hex.replace(/^#/, '');

  // 3桁の場合は6桁に展開（例: "F98" → "FF9988"）
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }

  if (h.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  return [r, g, b];
}

/**
 * RGB の u 値配列を Hex カラーコードに変換
 * @param u - [r, g, b] の配列（各値は 0.0〜1.0）
 * @returns Hex カラーコード（例: "#FF9800"）
 */
export function uToHex(u: [number, number, number]): string {
  const toHex = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    const hex = Math.round(clamped * 255).toString(16).padStart(2, '0');
    return hex;
  };

  return `#${toHex(u[0])}${toHex(u[1])}${toHex(u[2])}`.toUpperCase();
}

/**
 * Hex カラーコードを uniform オブジェクト形式に変換
 * @param hex - Hex カラーコード
 * @returns { value: [r, g, b] } 形式のオブジェクト
 */
export function hexToUniform(hex: string): { value: [number, number, number] } {
  return { value: hexToU(hex) };
}
