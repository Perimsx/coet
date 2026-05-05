import { desc, eq } from 'drizzle-orm'
import { db } from '@/server/db'
import { settings, suggestions } from '@/server/db/schema'
import { getAllComments } from '@/features/comments/lib/comments'
import { listPostFiles } from '@/features/content/lib/posts'

const DASHBOARD_REFRESH_KEY = 'admin.dashboard.last_refresh'

export type DashboardMetricDelta = {
  label: string
  current: number
  previous: number
  delta: number
  changeRate: number
}

export type SystemHealthSnapshot = {
  uptimeMinutes: number
  memoryUsedMb: number
  memoryRssMb: number
  databaseOk: boolean
  lastDashboardRefreshAt: string | null
}

type TimelinePoint = {
  date: string
  posts: number
  comments: number
  suggestions: number
}

type HeatmapPoint = {
  date: string
  count: number
}

export type AdminDashboardMetrics = {
  totals: {
    posts: number
    publishedPosts: number
    draftPosts: number
    comments: number
    pendingComments: number
    suggestions: number
    openSuggestions: number
  }
  deltas: {
    weekPosts: DashboardMetricDelta
    weekComments: DashboardMetricDelta
    weekSuggestions: DashboardMetricDelta
    monthPosts: DashboardMetricDelta
    monthComments: DashboardMetricDelta
    monthSuggestions: DashboardMetricDelta
  }
  timeline: TimelinePoint[]
  heatmap: HeatmapPoint[]
  system: SystemHealthSnapshot
}

function startOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatDay(value: Date) {
  return value.toISOString().slice(0, 10)
}

function buildDelta(label: string, current: number, previous: number): DashboardMetricDelta {
  const delta = current - previous
  const changeRate = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((delta / previous) * 100)

  return {
    label,
    current,
    previous,
    delta,
    changeRate,
  }
}

function countInRange(values: Date[], start: Date, end: Date) {
  const startMs = start.getTime()
  const endMs = end.getTime()
  return values.filter((value) => {
    const time = value.getTime()
    return time >= startMs && time < endMs
  }).length
}

async function getLastDashboardRefreshAt() {
  const row = db.select().from(settings).where(eq(settings.key, DASHBOARD_REFRESH_KEY)).get()
  if (!row?.value) return null

  try {
    const parsed = JSON.parse(row.value) as { refreshedAt?: string }
    return parsed.refreshedAt || null
  } catch {
    return null
  }
}

export async function markDashboardRefresh() {
  const refreshedAt = new Date().toISOString()
  db.insert(settings)
    .values({
      key: DASHBOARD_REFRESH_KEY,
      value: JSON.stringify({ refreshedAt }),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: JSON.stringify({ refreshedAt }),
        updatedAt: new Date(),
      },
    })
    .run()

  return refreshedAt
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const [posts, comments, suggestionRows, lastDashboardRefreshAt] = await Promise.all([
    listPostFiles(),
    getAllComments(),
    db.select().from(suggestions).orderBy(desc(suggestions.createdAt)).all(),
    getLastDashboardRefreshAt(),
  ])

  const now = new Date()
  const today = startOfDay(now)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  const previousSevenDaysStart = new Date(sevenDaysAgo)
  previousSevenDaysStart.setDate(sevenDaysAgo.getDate() - 7)

  const currentMonthStart = new Date(today)
  currentMonthStart.setDate(today.getDate() - 29)
  const previousMonthStart = new Date(currentMonthStart)
  previousMonthStart.setDate(currentMonthStart.getDate() - 30)

  const postDates = posts.map((post) => new Date(post.updatedAt || post.date))
  const commentDates = comments.map((comment) => new Date(comment.createdAt))
  const suggestionDates = suggestionRows.map((item) => new Date(item.createdAt))

  const weekPostCount = countInRange(postDates, sevenDaysAgo, new Date(today.getTime() + 86400000))
  const previousWeekPostCount = countInRange(postDates, previousSevenDaysStart, sevenDaysAgo)
  const weekCommentCount = countInRange(commentDates, sevenDaysAgo, new Date(today.getTime() + 86400000))
  const previousWeekCommentCount = countInRange(commentDates, previousSevenDaysStart, sevenDaysAgo)
  const weekSuggestionCount = countInRange(
    suggestionDates,
    sevenDaysAgo,
    new Date(today.getTime() + 86400000)
  )
  const previousWeekSuggestionCount = countInRange(
    suggestionDates,
    previousSevenDaysStart,
    sevenDaysAgo
  )

  const monthPostCount = countInRange(postDates, currentMonthStart, new Date(today.getTime() + 86400000))
  const previousMonthPostCount = countInRange(postDates, previousMonthStart, currentMonthStart)
  const monthCommentCount = countInRange(
    commentDates,
    currentMonthStart,
    new Date(today.getTime() + 86400000)
  )
  const previousMonthCommentCount = countInRange(commentDates, previousMonthStart, currentMonthStart)
  const monthSuggestionCount = countInRange(
    suggestionDates,
    currentMonthStart,
    new Date(today.getTime() + 86400000)
  )
  const previousMonthSuggestionCount = countInRange(
    suggestionDates,
    previousMonthStart,
    currentMonthStart
  )

  const timeline = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo)
    date.setDate(sevenDaysAgo.getDate() + index)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    return {
      date: formatDay(date),
      posts: countInRange(postDates, date, nextDate),
      comments: countInRange(commentDates, date, nextDate),
      suggestions: countInRange(suggestionDates, date, nextDate),
    }
  })

  const heatmapStart = new Date(today)
  heatmapStart.setDate(today.getDate() - 181)
  const heatmap = Array.from({ length: 182 }, (_, index) => {
    const date = new Date(heatmapStart)
    date.setDate(heatmapStart.getDate() + index)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    return {
      date: formatDay(date),
      count:
        countInRange(postDates, date, nextDate) +
        countInRange(commentDates, date, nextDate) +
        countInRange(suggestionDates, date, nextDate),
    }
  })

  let databaseOk = true
  try {
    db.select().from(settings).limit(1).all()
  } catch {
    databaseOk = false
  }

  const memory = process.memoryUsage()

  return {
    totals: {
      posts: posts.length,
      publishedPosts: posts.filter((post) => !post.draft).length,
      draftPosts: posts.filter((post) => post.draft).length,
      comments: comments.length,
      pendingComments: comments.filter((comment) => comment.status === 'pending').length,
      suggestions: suggestionRows.length,
      openSuggestions: suggestionRows.filter((item) => item.status !== 'resolved').length,
    },
    deltas: {
      weekPosts: buildDelta('本周文章', weekPostCount, previousWeekPostCount),
      weekComments: buildDelta('本周评论', weekCommentCount, previousWeekCommentCount),
      weekSuggestions: buildDelta('本周建议', weekSuggestionCount, previousWeekSuggestionCount),
      monthPosts: buildDelta('本月文章', monthPostCount, previousMonthPostCount),
      monthComments: buildDelta('本月评论', monthCommentCount, previousMonthCommentCount),
      monthSuggestions: buildDelta('本月建议', monthSuggestionCount, previousMonthSuggestionCount),
    },
    timeline,
    heatmap,
    system: {
      uptimeMinutes: Math.round(process.uptime() / 60),
      memoryUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      memoryRssMb: Math.round(memory.rss / 1024 / 1024),
      databaseOk,
      lastDashboardRefreshAt,
    },
  }
}
