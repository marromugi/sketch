import { chromium, type Browser, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// 設定
const CONFIG = {
  baseUrl: "http://localhost:4321",
  outputDir: path.join(process.cwd(), "public", "og"),
  viewport: { width: 520, height: 520 },
  deviceScaleFactor: 2,
  // シェーダー安定化のための待機時間（ミリ秒）
  shaderStabilizationDelay: 2000,
};

// スクリーンショット対象ページ
const SHADER_PAGES = [
  { path: "/shader", name: "shader" },
  { path: "/grain-gradient", name: "grain-gradient" },
  { path: "/tube-gradient", name: "tube-gradient" },
];

async function waitForShaderReady(page: Page): Promise<void> {
  // 1. キャンバス要素が存在することを確認
  await page.waitForSelector("canvas", { timeout: 10000 });

  // 2. WebGLコンテキストが初期化されるのを待機
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return false;
      const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
      return gl !== null;
    },
    { timeout: 10000 }
  );

  // 3. シェーダーがレンダリングを開始するまで待機
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) return false;

      const gl =
        (canvas.getContext("webgl") as WebGLRenderingContext) ||
        (canvas.getContext("webgl2") as WebGL2RenderingContext);
      if (!gl) return false;

      // ピクセルデータを読み取り、描画されていることを確認
      const pixels = new Uint8Array(4);
      gl.readPixels(
        Math.floor(canvas.width / 2),
        Math.floor(canvas.height / 2),
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
      );

      // 完全な黒または白でなければレンダリング済みと判断
      const isBlack = pixels[0] === 0 && pixels[1] === 0 && pixels[2] === 0;
      const isWhite =
        pixels[0] === 255 && pixels[1] === 255 && pixels[2] === 255;
      return !isBlack && !isWhite;
    },
    { timeout: 15000 }
  );
}

async function captureShader(
  page: Page,
  shaderPath: string,
  outputPath: string
): Promise<void> {
  console.log(`Capturing: ${shaderPath}`);

  // ページに移動
  await page.goto(`${CONFIG.baseUrl}${shaderPath}`, {
    waitUntil: "networkidle",
  });

  // シェーダーのレンダリング完了を待機
  await waitForShaderReady(page);

  // Astro Dev Toolbarを非表示にする
  await page.evaluate(() => {
    const devToolbar = document.querySelector("astro-dev-toolbar");
    if (devToolbar) {
      (devToolbar as HTMLElement).style.display = "none";
    }
  });

  // アニメーション安定化のため追加待機
  await page.waitForTimeout(CONFIG.shaderStabilizationDelay);

  // スクリーンショットを撮影
  await page.screenshot({
    path: outputPath,
    type: "png",
    fullPage: false,
  });

  console.log(`Saved: ${outputPath}`);
}

async function main(): Promise<void> {
  // 出力ディレクトリを作成
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // ブラウザを起動
  const browser: Browser = await chromium.launch({
    headless: true,
    args: [
      "--enable-webgl",
      "--use-gl=swiftshader",
      "--disable-gpu-sandbox",
      "--no-sandbox",
    ],
  });

  try {
    const context = await browser.newContext({
      viewport: CONFIG.viewport,
      deviceScaleFactor: CONFIG.deviceScaleFactor,
    });

    const page = await context.newPage();

    // 各シェーダーページをキャプチャ
    for (const shader of SHADER_PAGES) {
      const outputPath = path.join(CONFIG.outputDir, `${shader.name}.png`);
      await captureShader(page, shader.path, outputPath);
    }

    await context.close();
  } finally {
    await browser.close();
  }

  console.log("\nAll screenshots captured successfully!");
  console.log(`Output directory: ${CONFIG.outputDir}`);
}

// 実行
main().catch((error) => {
  console.error("Screenshot capture failed:", error);
  process.exit(1);
});
