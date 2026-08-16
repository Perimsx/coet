import React, { useState, useEffect } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
  Outlet,
} from 'react-router-dom'

import SiteLayout from '@/app/(site)/layout'
import HomePage from '@/app/(site)/page'
import BlogPage from '@/app/(site)/blog/page'
import BlogPostPage from '@/app/(site)/blog/[...slug]/page'
import CategoryIndexPage from '@/app/(site)/blog/category/page'
import CategoryDetailPage from '@/app/(site)/blog/category/[category]/page'
import TagDetailPage from '@/app/(site)/tags/[tag]/page'
import TagsPage from '@/app/(site)/tags/page'
import ArchivePage from '@/app/(site)/archive/page'
import FriendsPage from '@/app/(site)/friends/page'
import AboutPage from '@/app/(site)/about/page'
import NotFound from '@/app/not-found'
import Forbidden from '@/app/forbidden'

// Admin Views
import AdminLoginPage from '@/app/admin/login/page'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { DashboardView } from '@/features/admin/components/DashboardView'
import { PostsView } from '@/features/admin/components/PostsView'
import { PostEditor } from '@/features/admin/components/PostEditor'
import { TaxonomyView } from '@/features/admin/components/TaxonomyView'
import { PagesView } from '@/features/admin/components/PagesView'
import {
  CommentsView,
  SuggestionsView,
} from '@/features/admin/components/EngagementViews'
import {
  SiteSettingsView,
  NavigationView,
  FriendsView,
} from '@/features/admin/components/SiteManagementViews'
import { SEOManagementView } from '@/features/admin/components/SEOManagementView'
import { SystemHealthView } from '@/features/admin/components/SystemHealthView'
import {
  BackupManagementView,
  GitManagementView,
  JobsView,
} from '@/features/admin/components/SystemManagementViews'
import { AuditLogsView } from '@/features/admin/components/AuditLogsView'

function AsyncView({
  loader,
}: {
  loader: () => Promise<React.ReactElement | null>
}) {
  const [content, setContent] = useState<React.ReactElement | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const location = useLocation()

  useEffect(() => {
    let active = true
    setContent(null)
    setError(null)
    loader()
      .then((node) => {
        if (active) setContent(node)
      })
      .catch((err) => {
        if (active) setError(err)
      })
    return () => {
      active = false
    }
  }, [location.pathname, location.search])

  if (error) {
    return <NotFound />
  }

  return content
}

function SiteRoot() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  )
}

function AdminRoot() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}

function BlogPostRoute() {
  const location = useLocation()
  const pathAfterBlog = location.pathname.replace(/^\/blog\/?/, '')
  const slugParts = pathAfterBlog.split('/').filter(Boolean)

  return (
    <AsyncView
      loader={() =>
        BlogPostPage({ params: Promise.resolve({ slug: slugParts }) })
      }
    />
  )
}

function CategoryDetailRoute() {
  const params = useParams<{ category: string }>()
  const category = params.category || ''

  return (
    <AsyncView
      loader={() =>
        CategoryDetailPage({
          params: Promise.resolve({ category }),
        })
      }
    />
  )
}

function TagDetailRoute() {
  const params = useParams<{ tag: string }>()
  const tag = params.tag || ''

  return (
    <AsyncView
      loader={() =>
        TagDetailPage({
          params: Promise.resolve({ tag }),
        })
      }
    />
  )
}

export function AppRoutes() {
  return (
    <Routes>
      {/* 前台路由 */}
      <Route element={<SiteRoot />}>
        <Route index element={<AsyncView loader={HomePage} />} />
        <Route path="blog" element={<AsyncView loader={BlogPage} />} />
        <Route path="blog/*" element={<BlogPostRoute />} />
        <Route
          path="blog/category"
          element={<AsyncView loader={CategoryIndexPage} />}
        />
        <Route
          path="blog/category/:category"
          element={<CategoryDetailRoute />}
        />
        <Route path="tags" element={<AsyncView loader={TagsPage} />} />
        <Route path="tags/:tag" element={<TagDetailRoute />} />
        <Route path="archive" element={<AsyncView loader={ArchivePage} />} />
        <Route path="friends" element={<AsyncView loader={FriendsPage} />} />
        <Route path="about" element={<AsyncView loader={AboutPage} />} />
        <Route path="403" element={<Forbidden />} />
      </Route>

      {/* 后台管理路由 */}
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin" element={<AdminRoot />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />

        {/* 内容管理 */}
        <Route path="content/posts" element={<PostsView />} />
        <Route path="content/posts/new" element={<PostEditor />} />
        <Route path="content/posts/:id/edit" element={<PostEditor />} />
        <Route
          path="content/categories"
          element={<TaxonomyView mode="categories" />}
        />
        <Route
          path="content/tags"
          element={<TaxonomyView mode="tags" />}
        />
        <Route path="content/pages" element={<PagesView />} />

        {/* 互动管理 */}
        <Route path="engagement/comments" element={<CommentsView />} />
        <Route
          path="engagement/suggestions"
          element={<SuggestionsView />}
        />

        {/* 站点管理 */}
        <Route path="site/settings" element={<SiteSettingsView />} />
        <Route path="site/navigation" element={<NavigationView />} />
        <Route path="site/friends" element={<FriendsView />} />
        <Route path="site/seo" element={<SEOManagementView />} />

        {/* 系统管理 */}
        <Route path="system/health" element={<SystemHealthView />} />
        <Route path="system/backups" element={<BackupManagementView />} />
        <Route path="system/git" element={<GitManagementView />} />
        <Route path="system/jobs" element={<JobsView />} />
        <Route path="system/logs" element={<AuditLogsView />} />
      </Route>

      {/* 404 兜底 */}
      <Route
        path="*"
        element={
          <SiteLayout>
            <NotFound />
          </SiteLayout>
        }
      />
    </Routes>
  )
}
