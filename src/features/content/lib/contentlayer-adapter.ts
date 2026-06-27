import { allBlogs, allAuthors } from 'contentlayer/generated'
import type { Blog, Authors } from 'contentlayer/generated'
import tagData from '@/generated/content/tag-data.json'
import categoryData from '@/generated/content/category-data.json'

export function getAllBlogs(): Blog[] {
  return allBlogs
}

export function getAllAuthors(): Authors[] {
  return allAuthors
}

export function getTagData(): Record<string, number> {
  return tagData
}

export function getCategoryData(): Record<string, number> {
  return categoryData
}
