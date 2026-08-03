'use client'

import { Button, Card, CardBody } from '@/components/ui/heroui-helpers'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { AdminPageHeader } from './AdminPageHeader'

export function PlannedModule({
  title,
  description,
  returnTo = '/admin/dashboard',
}: {
  title: string
  description: string
  returnTo?: string
}) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title={title} subtitle={description} />
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
        <CardBody className="p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">模块即将上线</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              第一阶段已全量交付文章、离线文件存储、分类标签与安全 API。该模块将在后续版本迭代中完美连接。
            </p>
          </div>
          <Button onClick={() => router.push(returnTo)}>
            返回控制台
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
