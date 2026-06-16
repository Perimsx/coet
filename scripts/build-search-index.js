const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const isWatch = args.includes("--watch");

function buildIndex(options = {}) {
  const { allowMissing = false } = options;

  try {
    const veliteDir = path.join(__dirname, "../.velite");
    const publicDir = path.join(__dirname, "../public");
    
    const postsPath = path.join(veliteDir, "posts.json");
    if (!fs.existsSync(postsPath)) {
      const message = "Velite posts.json not found. Run velite build first.";
      if (allowMissing) {
        console.log(`[search-index] ${message} Waiting for Velite output...`);
        return false;
      }
      console.error(message);
      process.exit(1);
    }

    // 限制 posts.json 大小为 10MB，防止恶意大文件导致 Node OOM 崩溃
    const stats = fs.statSync(postsPath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error("posts.json exceeds safety size limit of 10MB");
    }

    const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));
    
    const searchIndex = posts.map((post) => {
      // 使用正则滤除 HTML 标签，减少索引体积
      const cleanContent = post.content
        ? post.content
            .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "") // 滤除大段代码
            .replace(/<[^>]*>/g, " ") // 滤除 HTML 标签
            .replace(/\s+/g, " ") // 合并空白符
            .trim()
        : "";

      const MAX_CONTENT_LENGTH = 5000;
      return {
        title: post.title,
        slug: post.slug,
        permalink: post.permalink,
        category: post.category || "",
        description: post.description || "",
        date: post.date || "",
        content: cleanContent.slice(0, MAX_CONTENT_LENGTH),
      };
    });

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(publicDir, "search-index.json"),
      JSON.stringify(searchIndex),
      "utf-8"
    );
    console.log(`Successfully built search index for ${searchIndex.length} posts.`);
    return true;
  } catch (err) {
    console.error("[search-index] Failed:", err.message);
    if (!isWatch) {
      process.exit(1);
    }
    return false;
  }
}

// 监听模式，用于开发模式下实时同步修改
if (isWatch) {
  const postsPath = path.join(__dirname, "../.velite/posts.json");
  console.log("[search-index] Watch mode active.");

  const setupWatch = () => {
    if (fs.existsSync(postsPath)) {
      buildIndex({ allowMissing: true });
      console.log("[search-index] Watching for changes in .velite/posts.json...");
      let timeout;
      fs.watch(postsPath, (eventType) => {
        if (eventType === "change") {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            console.log("[search-index] .velite/posts.json changed. Rebuilding index...");
            buildIndex();
          }, 300);
        }
      });
    } else {
      setTimeout(setupWatch, 1000);
    }
  };

  setupWatch();
} else {
  buildIndex();
}
