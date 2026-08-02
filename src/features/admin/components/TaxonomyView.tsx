'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, InputNumber, Message, Modal, Popconfirm, Space, Switch, Table, Tag, Typography } from '@arco-design/web-react'
import { IconDelete, IconEdit, IconPlus } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { Category, Tag as CMS_TAG } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

type Mode = 'categories' | 'tags'
export function TaxonomyView({ mode }: { mode: Mode }) {
  const isCategory = mode === 'categories'; const [items, setItems] = useState<(Category | CMS_TAG)[]>([]); const [modalVisible, setModalVisible] = useState(false); const [editing, setEditing] = useState<Category | CMS_TAG>(); const [form] = Form.useForm()
  const load = async () => {
    try {
      setItems(await (isCategory ? cmsApi.categories() : cmsApi.tags()))
    } catch {
      Message.error('数据加载失败')
    }
  }
  useEffect(() => { void load() }, [isCategory])
  const open = (item?: Category | CMS_TAG) => { setEditing(item); form.resetFields(); if (item) form.setFieldsValue(item); else form.setFieldsValue(isCategory ? { enabled: true, sortOrder: 0 } : {}); setModalVisible(true) }
  const save = async () => {
    try {
      const values = await form.validate()
      if (isCategory) {
        const category = values as Omit<Category, 'id' | 'postCount'>
        if (editing) await cmsApi.updateCategory(editing.id, category)
        else await cmsApi.createCategory(category)
      } else {
        const tag = values as Omit<CMS_TAG, 'id' | 'postCount'>
        if (editing) await cmsApi.updateTag(editing.id, tag)
        else await cmsApi.createTag(tag)
      }
      Message.success('已保存')
      setModalVisible(false)
      void load()
    } catch { Message.error('保存失败，请检查名称和 Slug 是否重复') }
  }
  const remove = async (item: Category | CMS_TAG) => {
    try {
      if (isCategory) await cmsApi.deleteCategory(item.id)
      else await cmsApi.deleteTag(item.id)
      Message.success('已删除')
      void load()
    } catch { Message.error(isCategory ? '分类可能仍被文章使用，请先迁移文章后再删除。' : '删除标签失败') }
  }
  return <><AdminPageHeader title={isCategory ? '分类' : '标签'} subtitle={isCategory ? '管理中英文分类标签与排序' : '管理文章标签与关联统计'} extra={<Button type="primary" icon={<IconPlus />} onClick={() => open()}>新建{isCategory ? '分类' : '标签'}</Button>} /><Card className="cot-admin-card"><div style={{ overflowX: 'auto' }}><Table rowKey="id" data={items} pagination={false} columns={isCategory ? [
    { title: '名称', render: (_, item) => <Space direction="vertical" size={2}><Typography.Text bold>{(item as Category).labelZh}</Typography.Text><Typography.Text type="secondary">{(item as Category).labelEn}</Typography.Text></Space> },
    { title: 'Slug', dataIndex: 'slug', render: value => <Typography.Text style={{ fontFamily: 'monospace' }}>{value}</Typography.Text> }, { title: '文章数', dataIndex: 'postCount' }, { title: '状态', dataIndex: 'enabled', render: value => <Tag color={value ? 'green' : 'gray'}>{value ? '启用' : '隐藏'}</Tag> }, { title: '操作', render: (_, item) => <Space><Button type="text" icon={<IconEdit />} onClick={() => open(item as Category)} /><Popconfirm title="删除分类" content="有关联文章的分类需先迁移文章。" onOk={() => remove(item as Category)}><Button type="text" status="danger" icon={<IconDelete />} /></Popconfirm></Space> },
  ] : [
    { title: '标签', dataIndex: 'name', render: value => <Typography.Text bold>{value}</Typography.Text> }, { title: 'Slug', dataIndex: 'slug', render: value => <Typography.Text style={{ fontFamily: 'monospace' }}>{value}</Typography.Text> }, { title: '文章数', dataIndex: 'postCount' }, { title: '描述', dataIndex: 'description' }, { title: '操作', render: (_, item) => <Space><Button type="text" icon={<IconEdit />} onClick={() => open(item as CMS_TAG)} /><Popconfirm title="删除标签" onOk={() => remove(item as CMS_TAG)}><Button type="text" status="danger" icon={<IconDelete />} /></Popconfirm></Space> },
  ]} /></div></Card><Modal title={`${editing ? '编辑' : '新建'}${isCategory ? '分类' : '标签'}`} visible={modalVisible} onCancel={() => setModalVisible(false)} onOk={save} okText="保存" unmountOnExit><Form form={form} layout="vertical"><Form.Item field="slug" label="Slug" required rules={[{ required: true }, { match: /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9]+)?$/, message: '仅限小写英文、数字和连字符' }]}><Input /></Form.Item>{isCategory ? <><Form.Item field="labelZh" label="中文名称" required rules={[{ required: true }]}><Input /></Form.Item><Form.Item field="labelEn" label="英文名称" required rules={[{ required: true }]}><Input /></Form.Item><Form.Item field="sortOrder" label="排序"><InputNumber min={0} /></Form.Item><Form.Item field="enabled" label="启用"><Switch /></Form.Item></> : <Form.Item field="name" label="名称" required rules={[{ required: true }]}><Input /></Form.Item>}<Form.Item field="description" label="描述"><Input.TextArea /></Form.Item></Form></Modal></>
}
