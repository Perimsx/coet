const fs = require("fs");
const path = require("path");

const SITE_URL = "https://cot.wiki";

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}

try {
  const postsPath = path.join(process.cwd(), ".velite", "posts.json");
  if (!fs.existsSync(postsPath)) {
    console.error("[sitemap] posts.json not found");
    process.exit(1);
  }

  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));

  const staticPages = [];
  const appDir = path.join(process.cwd(), "src", "app");

  function scanDir(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file === "page.tsx") {
        const relativePath = path.relative(appDir, currentDir);
        const segments = relativePath ? relativePath.split(path.sep) : [];

        // 过滤动态路由段，如 [...slug]
        const isDynamic = segments.some(seg => seg.includes("[") || seg.includes("]"));
        if (isDynamic) continue;

        // 过滤路由组段，如 (app) 或 (marketing)
        const routeSegments = segments.filter(seg => !(seg.startsWith("(") && seg.endsWith(")") || seg.includes("(")));

        let routePath = "/" + routeSegments.join("/");
        if (!routePath.endsWith("/")) {
          routePath += "/";
        }

        let changefreq = "monthly";
        let priority = "0.5";

        if (routePath === "/") {
          changefreq = "weekly";
          priority = "1.0";
        } else if (routePath === "/kb/") {
          changefreq = "weekly";
          priority = "0.9";
        }

        staticPages.push({
          url: routePath,
          changefreq,
          priority,
          lastmod: stat.mtime.toISOString().split("T")[0],
        });
      }
    }
  }

  scanDir(appDir);

  const postPages = posts.map((post) => ({
    url: post.permalink + "/",
    changefreq: "monthly",
    priority: "0.8",
    lastmod: post.date ? post.date.split("T")[0] : undefined,
  }));

  const allPages = [...staticPages, ...postPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(SITE_URL + page.url)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

  const outPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf-8");
  console.log(`[sitemap] Generated sitemap.xml with ${allPages.length} URLs`);
} catch (err) {
  console.error("[sitemap] Failed:", err.message);
  process.exit(1);
}
