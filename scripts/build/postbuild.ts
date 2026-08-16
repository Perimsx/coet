import { copyFileSync, existsSync, mkdirSync, writeFileSync, cpSync } from "fs";
import path from "path";

import rss from "./rss";
import { generateSitemapAndRobots } from "./sitemap";

function clearInsecureTlsOverride() {
  if (String(process.env.NODE_TLS_REJECT_UNAUTHORIZED || "").trim() !== "0") {
    return;
  }

  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
}

function syncBrandingFavicon() {
  const brandingFavicon = path.join(
    process.cwd(),
    "public",
    "branding",
    "favicon.ico",
  );
  const rootFavicon = path.join(process.cwd(), "public", "favicon.ico");

  if (existsSync(brandingFavicon)) {
    copyFileSync(brandingFavicon, rootFavicon);
  }
}

function writeIndexNowKeyFile() {
  const key = String(process.env.CMS_INDEXNOW_KEY || "").trim();
  if (!key) return;

  const publicDir = path.join(process.cwd(), "public");
  const keyFilePath = path.join(publicDir, `${key}.txt`);

  mkdirSync(publicDir, { recursive: true });
  writeFileSync(keyFilePath, `${key}\n`, "utf8");
}

function copyStandaloneAssets() {
  const distDir = process.env.NEXT_DIST_DIR || ".next";
  const standaloneDir = path.join(process.cwd(), distDir, "standalone");
  if (!existsSync(standaloneDir)) return;

  const staticDir = path.join(process.cwd(), distDir, "static");
  const staticDest = path.join(standaloneDir, distDir, "static");
  if (existsSync(staticDir)) {
    mkdirSync(staticDest, { recursive: true });
    cpSync(staticDir, staticDest, { recursive: true });
    console.log(
      `[postbuild] ${distDir}/static -> ${distDir}/standalone/${distDir}/static`,
    );
  }

  const publicDir = path.join(process.cwd(), "public");
  const publicDest = path.join(standaloneDir, "public");
  if (existsSync(publicDir)) {
    mkdirSync(publicDest, { recursive: true });
    cpSync(publicDir, publicDest, { recursive: true });
    console.log(`[postbuild] public -> ${distDir}/standalone/public`);
  }
}

export default async function postbuild() {
  clearInsecureTlsOverride();
  syncBrandingFavicon();
  writeIndexNowKeyFile();
  copyStandaloneAssets();
  await rss();
  await generateSitemapAndRobots();
}

postbuild();
