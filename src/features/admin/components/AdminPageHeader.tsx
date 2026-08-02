import { PageHeader, Space, Typography } from '@arco-design/web-react'

export function AdminPageHeader({ title, subtitle, extra }: { title: string; subtitle?: string; extra?: React.ReactNode }) {
  return <PageHeader className="xuzhan-admin-page-header" title={title} extra={extra}>
    {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
  </PageHeader>
}
