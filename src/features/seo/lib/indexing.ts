import { normalizeSiteUrl } from "@/shared/utils/site-url";

function buildAbsoluteUrls(siteUrl: string, urlList: string[]) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  return Array.from(
    new Set(
      urlList
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) =>
          url.startsWith("http")
            ? url
            : `${normalizedSiteUrl}${url.startsWith("/") ? url : `/${url}`}`,
        ),
    ),
  );
}

export async function pushToIndexNow(
  siteUrl: string,
  urlList: string[],
  key: string,
) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const host = new URL(normalizedSiteUrl).host;
  const endpoint = "https://api.indexnow.org/indexnow";
  const urls = buildAbsoluteUrls(normalizedSiteUrl, urlList);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${normalizedSiteUrl}/${key}.txt`,
        urlList: urls,
      }),
    });

    const responseText = await response.text();
    return {
      success: response.ok,
      status: response.status,
      message: responseText || "IndexNow 未返回额外信息",
    };
  } catch (error) {
    console.error("IndexNow push failed:", error);
    return {
      success: false,
      status: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function pushToBaidu(
  siteUrl: string,
  urlList: string[],
  token: string,
) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const host = new URL(normalizedSiteUrl).host;
  const endpoint = `http://data.zz.baidu.com/urls?site=${host}&token=${token}`;
  const urls = buildAbsoluteUrls(normalizedSiteUrl, urlList);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: urls.join("\n"),
    });

    const responseText = await response.text();
    let data: Record<string, unknown> | null = null;

    try {
      data = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      data = null;
    }

    const success =
      response.ok &&
      Boolean(data?.success || data?.remain || data?.successRemain);
    return {
      success,
      status: response.status,
      data,
      message:
        typeof data?.message === "string"
          ? data.message
          : responseText || "百度未返回额外信息",
    };
  } catch (error) {
    console.error("Baidu push failed:", error);
    return {
      success: false,
      status: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
