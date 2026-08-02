'use client'

import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Grid, Message, Modal, Popconfirm, Progress, Space, Table, Tag, Typography } from '@arco-design/web-react'
import { IconCloudDownload, IconCode, IconRefresh, IconSave, IconSync } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { Backup, GitStatus, SystemJob } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

const jobColors: Record<SystemJob['status'], 'arcoblue' | 'green' | 'red' | 'orange'> = { queued: 'arcoblue', running: 'orange', succeeded: 'green', failed: 'red' }
const jobLabels: Record<SystemJob['status'], string> = { queued: '排队中', running: '执行中', succeeded: '已完成', failed: '失败' }

function JobStatus({ job }: { job: SystemJob }) { return <Space direction="vertical" size={4} style={{ width: 180 }}><Tag color={jobColors[job.status]}>{jobLabels[job.status]}</Tag><Progress percent={job.progress} size="small" showText={false} /></Space> }

export function GitManagementView() {
  const [status, setStatus] = useState<GitStatus>(); const [loading, setLoading] = useState(true); const [actionLoading, setActionLoading] = useState(false); const [job, setJob] = useState<SystemJob>(); const [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true);setError('');try{setStatus(await cmsApi.gitStatus())}catch{setError('无法读取 Git 状态，请检查服务器的 CMS_REPOSITORY_DIR 配置。')}finally{setLoading(false)} }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => { if(!job || ['succeeded','failed'].includes(job.status)) return; const timer=window.setInterval(() => cmsApi.job(job.id).then(setJob).catch(() => window.clearInterval(timer)), 1200); return () => window.clearInterval(timer) }, [job])
  const action = async (kind: 'check' | 'update') => { setActionLoading(true); try{const next=kind==='check'?await cmsApi.checkGitUpdates():await cmsApi.updateGit();setJob(next);Message.success(kind==='check'?'已开始检查远程更新':'已开始执行受限更新任务')}catch{Message.error('任务无法启动，请检查固定的仓库、分支和部署脚本配置')}finally{setActionLoading(false)} }
  return <><AdminPageHeader title="代码更新" subtitle="仅操作服务器环境变量指定的仓库、远程和分支，不接受页面输入的命令或 Git 地址" extra={<Space><Button icon={<IconRefresh />} onClick={load} loading={loading}>刷新状态</Button><Button icon={<IconSync />} onClick={() => action('check')} loading={actionLoading}>检查更新</Button><Popconfirm title="执行代码更新" content="将固定执行 fetch、pull --ff-only 和服务器配置的部署脚本。" onOk={() => action('update')}><Button type="primary" icon={<IconCloudDownload />} loading={actionLoading}>拉取并部署</Button></Popconfirm></Space>} />
    {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}
    {!loading && status && <Grid.Row gutter={16}><Grid.Col xs={24} lg={14} style={{ marginBottom: 16 }}><Card className="cot-admin-card" title="当前代码状态"><Descriptions column={1} data={[{ label:'仓库目录',value:<Typography.Text copyable>{status.repository || '未配置'}</Typography.Text> },{label:'分支',value:<Typography.Text style={{fontFamily:'monospace'}}>{status.branch}</Typography.Text>},{label:'当前 Commit',value:<Typography.Text copyable style={{fontFamily:'monospace'}}>{status.commit || '—'}</Typography.Text>},{label:'提交时间',value:status.commitTime||'—'},{label:'工作区',value:<Tag color={status.dirty?'red':'green'}>{status.dirty?'存在未提交改动':'干净'}</Tag>},{label:'远程更新',value:<Tag color={status.remoteAhead>0?'orange':'green'}>{status.remoteAhead} 个待更新提交</Tag> }]} /></Card></Grid.Col><Grid.Col xs={24} lg={10} style={{ marginBottom: 16 }}><Card className="cot-admin-card" title="任务状态">{job ? <><JobStatus job={job}/><Typography.Paragraph type="secondary" style={{marginTop:12}}>{job.message}</Typography.Paragraph>{job.logs && <Typography.Paragraph style={{whiteSpace:'pre-wrap',fontFamily:'monospace',fontSize:12}}>{job.logs}</Typography.Paragraph>}</> : <Typography.Text type="secondary">尚未发起检查或更新任务。</Typography.Text>}</Card></Grid.Col></Grid.Row>}
  </>
}

export function BackupManagementView() {
  const [items,setItems]=useState<Backup[]>([]);const [loading,setLoading]=useState(true);const [job,setJob]=useState<SystemJob>(); const load=useCallback(async()=>{setLoading(true);try{setItems(await cmsApi.backups())}catch{Message.error('备份列表加载失败')}finally{setLoading(false)}},[])
  useEffect(()=>{void load()},[load]);useEffect(()=>{if(!job||['succeeded','failed'].includes(job.status))return;const timer=window.setInterval(()=>cmsApi.job(job.id).then(next=>{setJob(next);if(next.status==='succeeded')void load()}).catch(()=>window.clearInterval(timer)),1200);return()=>window.clearInterval(timer)},[job,load])
  const create=async()=>{try{setJob(await cmsApi.createBackup());Message.success('备份任务已开始')}catch{Message.error('无法启动备份任务')}}
  return <><AdminPageHeader title="SQLite 备份" subtitle="使用 SQLite 原生一致性快照创建备份；恢复必须在受控维护窗口内执行" extra={<Button type="primary" icon={<IconSave />} onClick={create}>创建备份</Button>} />
    {job&&<Alert type={job.status==='failed'?'error':'info'} title={job.message} content={job.logs||undefined} style={{marginBottom:16}} />}
    <Card className="cot-admin-card"><div style={{overflowX:'auto'}}><Table rowKey="id" loading={loading} data={items} pagination={false} columns={[{title:'备份文件',dataIndex:'fileName',render:value=><Typography.Text style={{fontFamily:'monospace'}}>{value}</Typography.Text>},{title:'大小',dataIndex:'fileSize',render:value=>`${(value/1024).toFixed(1)} KB`},{title:'校验和',dataIndex:'checksum',render:value=><Typography.Text copyable ellipsis={{showTooltip:true}} style={{fontFamily:'monospace',maxWidth:220}}>{value}</Typography.Text>},{title:'创建时间',dataIndex:'createdAt',render:value=>new Date(value).toLocaleString('zh-CN')},{title:'恢复',render:(_,item)=><Button type="text" disabled>需维护窗口</Button>}]} /></div></Card>
  </>
}

export function JobsView() { const [data,setData]=useState<{items:SystemJob[];total:number}>({items:[],total:0});const [loading,setLoading]=useState(true);const load=useCallback(async()=>{setLoading(true);try{setData(await cmsApi.jobs())}catch{Message.error('任务列表加载失败')}finally{setLoading(false)}},[]);useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),3000);return()=>window.clearInterval(timer)},[load]);return <><AdminPageHeader title="后台任务" subtitle="Git 更新、备份、SEO 和维护操作均在后台执行，不阻塞管理请求" extra={<Button icon={<IconRefresh/>} onClick={load}>刷新</Button>} /><Card className="cot-admin-card"><div style={{overflowX:'auto'}}><Table rowKey="id" loading={loading} data={data.items} pagination={{total:data.total,pageSize:20}} columns={[{title:'类型',dataIndex:'type'},{title:'状态',render:(_,job)=><JobStatus job={job as SystemJob}/>},{title:'信息',dataIndex:'message'},{title:'创建时间',dataIndex:'createdAt',render:value=>new Date(value).toLocaleString('zh-CN')},{title:'日志',dataIndex:'logs',render:value=>value?<Typography.Text ellipsis={{showTooltip:true}} style={{maxWidth:240,display:'inline-block',fontFamily:'monospace'}}>{value}</Typography.Text>:'—'}]} /></div></Card></> }
