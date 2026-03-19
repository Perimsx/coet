import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

type CategoryLabelsMap = Record<string, { zh: string; en: string }>;

type StoredCategoryDefinition = {
  slug?: string;
  labelZh?: string;
  labelEn?: string;
};

const generatedContentDir = path.join(
  process.cwd(),
  "src",
  "generated",
  "content",
);
const categoryLabelsPath = path.join(
  generatedContentDir,
  "category-labels.json",
);
const categoryDataPath = path.join(generatedContentDir, "category-data.json");
const tagDataPath = path.join(generatedContentDir, "tag-data.json");
const storedCategoriesPath = path.join(
  process.cwd(),
  "storage",
  "settings",
  "categories.json",
);

const DEFAULT_CATEGORY_LABELS: CategoryLabelsMap = {
  general: {
    zh: "\u7efc\u5408",
    en: "General",
  },
  "artificial-intelligence": {
    zh: "\u4eba\u5de5\u667a\u80fd",
    en: "Artificial Intelligence",
  },
  cybersecurity: {
    zh: "\u7f51\u7edc\u5b89\u5168",
    en: "Cybersecurity",
  },
  "penetration-testing": {
    zh: "\u6e17\u900f\u6d4b\u8bd5",
    en: "Penetration Testing",
  },
  algorithms: {
    zh: "\u7b97\u6cd5",
    en: "Algorithms",
  },
  "project-practice": {
    zh: "\u9879\u76ee\u5b9e\u8df5",
    en: "Project Practice",
  },
};

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeSlug(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/\s+/g, "-");
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFallbackChineseLabel(slug: string): string {
  if (!slug) return DEFAULT_CATEGORY_LABELS.general.zh;
  return slug.replace(/-/g, " ");
}

function getFallbackEnglishLabel(slug: string): string {
  if (!slug) return DEFAULT_CATEGORY_LABELS.general.en;
  return toTitleCase(slug);
}

function mergeCategoryLabel(
  target: CategoryLabelsMap,
  slugValue: unknown,
  zhValue?: unknown,
  enValue?: unknown,
) {
  const slug = normalizeSlug(slugValue);
  if (!slug) return;

  target[slug] = {
    zh:
      String(zhValue || "").trim() ||
      target[slug]?.zh ||
      getFallbackChineseLabel(slug),
    en:
      String(enValue || "").trim() ||
      target[slug]?.en ||
      getFallbackEnglishLabel(slug),
  };
}

async function buildCategoryLabelsMap(): Promise<CategoryLabelsMap> {
  const merged: CategoryLabelsMap = { ...DEFAULT_CATEGORY_LABELS };

  const existingLabels =
    await readJsonFile<CategoryLabelsMap>(categoryLabelsPath);
  if (existingLabels) {
    for (const [slug, labels] of Object.entries(existingLabels)) {
      mergeCategoryLabel(merged, slug, labels?.zh, labels?.en);
    }
  }

  const storedCategories =
    await readJsonFile<StoredCategoryDefinition[]>(storedCategoriesPath);
  if (Array.isArray(storedCategories)) {
    for (const item of storedCategories) {
      mergeCategoryLabel(merged, item.slug, item.labelZh, item.labelEn);
    }
  }

  const categoryData =
    await readJsonFile<Record<string, number>>(categoryDataPath);
  if (categoryData) {
    for (const slug of Object.keys(categoryData)) {
      mergeCategoryLabel(merged, slug);
    }
  }

  mergeCategoryLabel(
    merged,
    "general",
    DEFAULT_CATEGORY_LABELS.general.zh,
    DEFAULT_CATEGORY_LABELS.general.en,
  );

  return merged;
}

async function ensureCategoryLabelsFile() {
  const categoryLabels = await buildCategoryLabelsMap();

  await mkdir(generatedContentDir, { recursive: true });
  await writeFile(
    categoryLabelsPath,
    `${JSON.stringify(categoryLabels, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `[prepare-generated-content] category-labels.json ready: ${Object.keys(categoryLabels).length} entries`,
  );
}

async function ensureJsonFile(filePath: string, fallbackValue: unknown) {
  const existing = await readJsonFile<unknown>(filePath);
  if (existing !== null) return;

  await mkdir(generatedContentDir, { recursive: true });
  await writeFile(
    filePath,
    `${JSON.stringify(fallbackValue, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `[prepare-generated-content] created fallback: ${path.basename(filePath)}`,
  );
}

async function main() {
  await ensureJsonFile(categoryDataPath, {});
  await ensureJsonFile(tagDataPath, {});
  await ensureCategoryLabelsFile();
}

main().catch((error) => {
  console.error("[prepare-generated-content] failed:", error);
  process.exitCode = 1;
});
