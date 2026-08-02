'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Chip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@/components/ui/heroui-helpers'
import { RefreshCw, Download, RotateCcw, GitBranch as GitIcon, Save, Activity, Database } from 'lucide-react'
import { cmsApi } from '@/features/admin/lib/api'
import type { Backup, GitStatus, SystemJob } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { AdminPageHeader } from './AdminPageHeader'

const jobColors: Record<SystemJob['status'], 'primary' | 'success' | 'danger' | 'warning'> = {
  queued: 'primary',
  running: 'warning',
  succeeded: 'success',
  failed: 'danger',
}

const jobLabels: Record<SystemJob['status'], string> = {
  queued: '排队中',
  running: '执行中',
  succeeded: '已完成',
  failed: '失败',
}

function JobStatus({ job }: { job: SystemJob }) {
  return (
    <div className="flex flex-col gap-1.5 w-36 sm:w-40">
      <div className="flex items-center justify-between">
        <Chip size="sm" color={jobColors[job.status]}>
          {jobLabels[job.status]}
        </Chip>
        <span className="text-xs font-mono text-zinc-400">{job.progress}%</span>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${job.progress}%` }}
        />
      </div>
    </div>
  )
}

export function GitManagementView() {
  const [status, setStatus] = useState<GitStatus>()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [job, setJob] = useState<SystemJob>()
  const [error, setError] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [pendingAction, setPendingAction] = useState<'update' | 'rollback'>('update')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setStatus(await cmsApi.gitStatus())
    } catch {
      setError('无法读取 Git 状态，请检查服务器的 CMS_REPOSITORY_DIR 配置。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!job || ['succeeded', 'failed'].includes(job.status)) return
    const timer = window.setInterval(
      () => cmsApi.job(job.id).then(setJob).catch(() => window.clearInterval(timer)),
      1200
    )
    return () => window.clearTimeout(timer)
  }, [job])

  const action = async (kind: 'check' | 'update' | 'rollback') => {
    setActionLoading(true)
    try {
      const next =
        kind === 'check'
          ? await cmsApi.checkGitUpdates()
          : kind === 'update'
          ? await cmsApi.updateGit()
          : await cmsApi.rollbackGit()
      setJob(next)
      toast.success(
        kind === 'check'
          ? '已启动远程拉取检查'
          : kind === 'update'
          ? '已开始执行部署更新任务'
          : '已开始回滚任务'
      )
    } catch {
      toast.error('任务启动失败，请确认服务器部署脚本路径')
    } finally {
      setActionLoading(false)
      onClose()
    }
  }

  const promptConfirm = (kind: 'update' | 'rollback') => {
    setPendingAction(kind)
    onOpen()
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="代码同步与更新"
        subtitle="受控的 Git 代码拉取、热更新部署与历史版本回滚"
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={load} className="shadow-sm font-medium inline-flex items-center justify-center whitespace-nowrap shrink-0">
              <RefreshCw className="w-4 h-4 mr-1.5 shrink-0" />
              <span>刷新状态</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => action('check')} className="shadow-sm font-medium inline-flex items-center justify-center whitespace-nowrap shrink-0">
              <span>检查更新</span>
            </Button>
            <Button size="sm" onClick={() => promptConfirm('update')} className="shadow-sm font-medium inline-flex items-center justify-center whitespace-nowrap shrink-0">
              <Download className="w-4 h-4 mr-1.5 shrink-0" />
              <span>拉取并部署</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => promptConfirm('rollback')} className="shadow-sm font-medium inline-flex items-center justify-center whitespace-nowrap shrink-0">
              <RotateCcw className="w-4 h-4 mr-1.5 shrink-0" />
              <span>回滚版本</span>
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs leading-relaxed">
          {error}
        </div>
      )}

      {!loading && status && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <Card className="lg:col-span-7 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardHeader className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5 flex items-center gap-2">
              <GitIcon className="w-4 h-4 text-primary" />
              <span>当前代码分支与 Commit</span>
            </CardHeader>
            <CardBody className="p-4 flex flex-col gap-3.5 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">仓库路径</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 truncate max-w-xs">{status.repository || '未配置'}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">当前分支</span>
                <span className="font-mono font-bold text-primary">{status.branch}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">当前 Commit</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">{status.commit || '—'}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">提交时间</span>
                <span className="text-zinc-900 dark:text-zinc-100">{status.commitTime || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">工作区状态</span>
                <Chip size="sm" color={status.dirty ? 'danger' : 'success'}>
                  {status.dirty ? '存在未提交改动' : '干净无冲突'}
                </Chip>
              </div>
            </CardBody>
          </Card>

          <Card className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardHeader className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>最新部署任务进展</span>
            </CardHeader>
            <CardBody className="p-4 flex flex-col gap-3 text-xs">
              {job ? (
                <>
                  <JobStatus job={job} />
                  <p className="text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">{job.message}</p>
                  {job.logs && (
                    <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-none">
                      {job.logs}
                    </pre>
                  )}
                </>
              ) : (
                <span className="text-zinc-400 py-4 text-center">尚未发起代码更新或回滚任务。</span>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>{pendingAction === 'update' ? '确认拉取并部署' : '确认版本回滚'}</ModalHeader>
        <ModalBody>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {pendingAction === 'update'
              ? '即将执行 git fetch 与 pull --ff-only，并调用服务器预设的具体构建与热部署脚本。'
              : '即将回退代码库至上一个稳定版本 Commit 并重新执行构建更新。'}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" variant="primary" onClick={() => action(pendingAction)}>
            确认执行操作
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export function BackupManagementView() {
  const [items, setItems] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<SystemJob>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await cmsApi.backups())
    } catch {
      toast.error('备份列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!job || ['succeeded', 'failed'].includes(job.status)) return
    const timer = window.setInterval(
      () =>
        cmsApi.job(job.id).then((next) => {
          setJob(next)
          if (next.status === 'succeeded') void load()
        }).catch(() => window.clearInterval(timer)),
      1200
    )
    return () => window.clearTimeout(timer)
  }, [job, load])

  const create = async () => {
    try {
      setJob(await cmsApi.createBackup())
      toast.success('SQLite 快照备份任务已启动')
    } catch {
      toast.error('无法启动备份任务')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="数据库快照备份"
        subtitle="基于 SQLite VACUUM INTO 原生原子快照建立的一致性数据备份"
        extra={
          <Button
            size="sm"
            onClick={create}
            className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 border-0 cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>创建快照备份</span>
          </Button>
        }
      />

      {job && (
        <div className={`p-4 rounded-2xl border text-xs shadow-sm ${job.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
          <span>{job.message}</span>
        </div>
      )}

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
        <CardBody className="p-3">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[550px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">备份文件名</th>
                  <th className="pb-3 font-semibold text-xs">文件体积</th>
                  <th className="pb-3 font-semibold text-xs">SHA256 校验和</th>
                  <th className="pb-3 font-semibold text-xs">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400">
                      加载中...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400">
                      暂无快照备份记录
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <Database className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100">{item.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-xs font-mono text-zinc-500">{(item.fileSize / 1024).toFixed(1)} KB</td>
                      <td className="py-3 font-mono text-[11px] text-zinc-400 max-w-xs truncate">{item.checksum}</td>
                      <td className="py-3 text-xs font-mono text-zinc-400">
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export function JobsView() {
  const [data, setData] = useState<{ items: SystemJob[]; total: number }>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await cmsApi.jobs())
    } catch {
      toast.error('后台任务加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 3000)
    return () => window.clearTimeout(timer)
  }, [load])

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="后台任务队列"
        subtitle="实时监控代码部署、快照备份、SEO 推送等后台维护任务"
        extra={
          <Button variant="ghost" size="sm" onClick={load} className="shadow-sm font-medium inline-flex items-center justify-center whitespace-nowrap shrink-0">
            <RefreshCw className="w-4 h-4 mr-1.5 shrink-0" />
            <span>刷新任务</span>
          </Button>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
        <CardBody className="p-3">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">任务类型</th>
                  <th className="pb-3 font-semibold text-xs">状态与进度</th>
                  <th className="pb-3 font-semibold text-xs">描述信息</th>
                  <th className="pb-3 font-semibold text-xs">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400">
                      加载中...
                    </td>
                  </tr>
                ) : data.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400">
                      暂无异步后台任务
                    </td>
                  </tr>
                ) : (
                  data.items.map((job) => (
                    <tr key={job.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 font-mono text-xs font-semibold text-primary">{job.type}</td>
                      <td className="py-3">
                        <JobStatus job={job} />
                      </td>
                      <td className="py-3 text-xs text-zinc-700 dark:text-zinc-300 max-w-xs leading-relaxed">{job.message}</td>
                      <td className="py-3 text-xs font-mono text-zinc-400">
                        {new Date(job.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
