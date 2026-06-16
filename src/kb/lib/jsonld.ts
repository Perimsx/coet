/**
 * JSON-LD Structured Data helpers
 * Generates schema.org structured data objects for SEO.
 */

import { SITE_NAME, SITE_URL } from "./constants";

/* ------------------------------------------------------------------ */
/*  TechArticle schema                                                 */
/* ------------------------------------------------------------------ */

interface ArticleInput {
  title: string;
  description?: string;
  date?: string;
  permalink: string;
}

export function generateArticleSchema(post: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: post.title,
    description: post.description ?? "",
    datePublished: post.date ?? "",
    url: `${SITE_URL}${post.permalink}`,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  BreadcrumbList schema                                              */
/* ------------------------------------------------------------------ */

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
