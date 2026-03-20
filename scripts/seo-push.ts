import "dotenv/config";

import { existsSync, readFileSync } from "fs";
import path from "path";
import { slug } from "github-slugger";

import { allBlogs } from "../.contentlayer/generated/index.mjs";
import siteMetadata from "../src/config/site";
import { resolvePostCategories } from "../src/features/content/lib/post-categories";
import { pushToBaidu, pushToIndexNow } from "../src/features/seo/lib/indexing";
import { normalizeSiteUrl } from "../src/shared/utils/site-url";

const POSTS_PER_PAGE = 5;
const isInteractive = Boolean(process.stdout.isTTY);
const RESET = isInteractive ? "\x1b[0m" : "";
const BOLD = isInteractive ? "\x1b[1m" : "";
const CYAN = isInteractive ? "\x1b[36m" : "";
const GREEN = isInteractive ? "\x1b[32m" : "";
const YELLOW = isInteractive ? "\x1b[33m" : "";
const MAGENTA = isInteractive ? "\x1b[35m" : "";

function section(title: string) {
  console.log(`\n${BOLD}${MAGENTA}==> ${title}${RESET}`);
}

function info(message: string) {
  console.log(`${CYAN}${message}${RESET}`);
}

function success(message: string) {
  console.log(`${GREEN}${message}${RESET}`);
}

function warn(message: string) {
  console.log(`${YELLOW}${message}${RESET}`);
}

function clearInsecureTlsOverride() {
  if (String(process.env.NODE_TLS_REJECT_UNAUTHORIZED || "").trim() !== "0") {
    return;
  }

  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  warn(
    "检测到 NODE_TLS_REJECT_UNAUTHORIZED=0，收录脚本已忽略该不安全配置并恢复证书校验。",
  );
}

function isPrivateOrLocalHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (/^127\./.test(normalized)) return true;
  if (/^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;

  const private172 = normalized.match(/^172\.(\d{1,2})\./);
  if (private172) {
    const secondOctet = Number(private172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return false;
}

function buildPushUrls(siteUrl: string) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const publishedPosts = allBlogs.filter((post) => !post.draft);
  const tagCountMap = new Map<string, number>();
  const categoryCountMap = new Map<string, number>();

  publishedPosts.forEach((post) => {
    post.tags?.forEach((tag) => {
      const tagSlug = slug(tag);
      tagCountMap.set(tagSlug, (tagCountMap.get(tagSlug) || 0) + 1);
    });

    resolvePostCategories(post.categories, post.filePath).forEach(
      (category) => {
        categoryCountMap.set(
          category,
          (categoryCountMap.get(category) || 0) + 1,
        );
      },
    );
  });

  const blogPaginationRoutes = Array.from(
    {
      length: Math.max(
        0,
        Math.ceil(publishedPosts.length / POSTS_PER_PAGE) - 1,
      ),
    },
    (_, index) => `/blog/page/${index + 2}`,
  );

  const tagRoutes = Array.from(tagCountMap.keys()).map(
    (tagSlug) => `/tags/${tagSlug}`,
  );
  const tagPaginationRoutes = Array.from(tagCountMap.entries()).flatMap(
    ([tagSlug, count]) =>
      Array.from(
        { length: Math.max(0, Math.ceil(count / POSTS_PER_PAGE) - 1) },
        (_, index) => `/tags/${tagSlug}/page/${index + 2}`,
      ),
  );

  const categoryRoutes = Array.from(categoryCountMap.keys()).map(
    (category) => `/blog/category/${encodeURIComponent(category)}`,
  );
  const categoryPaginationRoutes = Array.from(
    categoryCountMap.entries(),
  ).flatMap(([category, count]) =>
    Array.from(
      { length: Math.max(0, Math.ceil(count / POSTS_PER_PAGE) - 1) },
      (_, index) =>
        `/blog/category/${encodeURIComponent(category)}/page/${index + 2}`,
    ),
  );

  return Array.from(
    new Set([
      "/",
      "/about",
      "/archive",
      "/blog",
      "/friends",
      "/projects",
      "/tags",
      ...publishedPosts.map((post) => `/${post.path}`),
      ...blogPaginationRoutes,
      ...tagRoutes,
      ...tagPaginationRoutes,
      ...categoryRoutes,
      ...categoryPaginationRoutes,
    ]),
  ).map((pathname) => `${normalizedSiteUrl}${pathname}`);
}

async function verifyRobots(siteUrl: string) {
  const robotsUrl = `${normalizeSiteUrl(siteUrl)}/robots.txt`;

  try {
    const response = await fetch(robotsUrl, { cache: "no-store" });
    const content = await response.text();
    const explicitlyAllowed = /(^|\n)\s*Allow:\s*\/\s*($|\n)/m.test(content);
    const blocksAll = /(^|\n)\s*Disallow:\s*\/\s*($|\n)/m.test(content);
    const allowed = explicitlyAllowed || !blocksAll;

    if (response.ok && allowed) {
      success(`robots.txt 放行正常：${robotsUrl}`);
      return true;
    }

    warn(`robots.txt 规则可能异常，请检查：${robotsUrl}`);
    return false;
  } catch (error) {
    warn(
      `robots.txt 检查失败：${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
}

function verifyIndexNowKeyFile(key: string) {
  const keyFilePath = path.join(process.cwd(), "public", `${key}.txt`);

  if (!existsSync(keyFilePath)) {
    warn(`未找到 IndexNow 验证文件：${keyFilePath}`);
    return false;
  }

  const content = readFileSync(keyFilePath, "utf8").trim();
  if (content !== key) {
    warn(`IndexNow 验证文件内容不匹配：${keyFilePath}`);
    return false;
  }

  success(`IndexNow 验证文件已就绪：${keyFilePath}`);
  return true;
}

async function runPush() {
  section("收录前置检查");
  clearInsecureTlsOverride();

  // 优先加载存储中的动态配置
  const settingsPath = path.join(process.cwd(), "storage/settings/site-settings.json");
  let settings: any = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch (e) {
      warn(`加载站点配置文件失败：${settingsPath}`);
    }
  }

  const siteUrl = normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      settings.siteUrl ||
      siteMetadata.siteUrl,
  );
  
  const baiduToken = String(
    process.env.BAIDU_PUSH_TOKEN || settings.baiduSearchConsole || "",
  ).trim();
  
  const indexNowKey = String(
    process.env.INDEXNOW_KEY || settings.indexNowKey || "",
  ).trim();
  const host = new URL(siteUrl).hostname;

  info(`站点地址：${siteUrl}`);

  if (isPrivateOrLocalHost(host)) {
    warn("当前站点地址指向本地或私有网络，已跳过外部搜索引擎推送。");
    return;
  }

  const urls = buildPushUrls(siteUrl);
  info(`本次待提交 URL 数量：${urls.length}`);

  await verifyRobots(siteUrl);

  if (!baiduToken && !indexNowKey) {
    warn(
      "未配置 BAIDU_PUSH_TOKEN 或 INDEXNOW_KEY，将只保留 robots/sitemap 自然抓取能力。",
    );
    return;
  }

  const failures: string[] = [];

  section("开始推送");

  if (baiduToken) {
    info("正在提交百度普通收录...");
    const result = await pushToBaidu(siteUrl, urls, baiduToken);
    if (result.success) {
      success(`百度收录推送成功，状态：${result.status}`);
    } else {
      failures.push("Baidu");
      warn(`百度收录推送失败：${result.message}`);
    }
  } else {
    warn("未配置 BAIDU_PUSH_TOKEN，已跳过百度推送。");
  }

  if (indexNowKey) {
    const keyFileReady = verifyIndexNowKeyFile(indexNowKey);
    if (!keyFileReady) {
      failures.push("IndexNow");
    } else {
      info("正在提交 IndexNow...");
      const result = await pushToIndexNow(siteUrl, urls, indexNowKey);
      if (result.success) {
        success(`IndexNow 推送成功，状态：${result.status}`);
      } else {
        failures.push("IndexNow");
        warn(`IndexNow 推送失败：${result.message}`);
      }
    }
  } else {
    warn("未配置 INDEXNOW_KEY，已跳过 IndexNow 推送。");
  }

  section("收录结果");
  if (failures.length > 0) {
    warn(`以下渠道未成功：${failures.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  success("所有已配置的收录渠道都已执行完成。");
}

runPush().catch((error) => {
  console.error("SEO 推送流程执行失败：", error);
  process.exitCode = 1;
});
