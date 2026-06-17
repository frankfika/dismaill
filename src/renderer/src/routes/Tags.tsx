import { useState } from 'react'
import { useTags } from '../hooks/useTags'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { Tag, Plus, Trash2, Pencil, ChevronRight, Sparkles } from 'lucide-react'

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#06B6D4', '#10B981',
  '#F59E0B', '#EF4444', '#EC4899', '#84CC16',
]

export default function Tags() {
  const { tags, isLoading, createTag, updateTag, deleteTag } = useTags()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTag, setEditingTag] = useState<typeof tags[0] | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
    description: '',
    isAiEnabled: false
  })

  const handleCreateTag = async () => {
    if (!formData.name.trim()) return
    const result = await createTag({
      name: formData.name,
      color: formData.color,
      description: formData.description,
      isAiEnabled: formData.isAiEnabled,
    })
    if (result) {
      setShowCreateModal(false)
      resetForm()
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !formData.name.trim()) return
    const success = await updateTag({
      id: editingTag.id,
      name: formData.name,
      color: formData.color,
      description: formData.description,
      isAiEnabled: formData.isAiEnabled,
    })
    if (success) {
      setEditingTag(null)
      resetForm()
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('确定删除此标签？邮件不会被删除。')) return
    await deleteTag(tagId)
  }

  const resetForm = () => {
    setFormData({ name: '', color: PRESET_COLORS[0], description: '', isAiEnabled: false })
  }

  const openEditModal = (tag: typeof tags[0]) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
      isAiEnabled: tag.isAiEnabled
    })
  }

  const isModalOpen = showCreateModal || !!editingTag
  const closeModal = () => {
    setShowCreateModal(false)
    setEditingTag(null)
    resetForm()
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Tag size={16} />
              智能标签
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">让邮件标签、自动归类与学习模型统一管理</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowCreateModal(true) }}
            size="sm"
            className="rounded-md gap-1.5"
          >
            <Plus size={14} />
            新建标签
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-14 text-center text-muted-foreground">
            <Tag size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm">暂无标签</p>
            <p className="text-xs mt-1">创建标签来组织邮件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{tag.name}</h3>
                      {tag.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{tag.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {tag.isAiEnabled && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-medium flex items-center gap-0.5">
                        <Sparkles size={9} />
                        AI
                      </span>
                    )}
                    <button onClick={() => openEditModal(tag)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDeleteTag(tag.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                  <span className="text-muted-foreground">
                    {tag.emailCount} 封邮件
                  </span>
                  <button className="text-primary hover:text-primary/80 flex items-center gap-0.5 text-[11px]">
                    查看邮件 <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Section */}
        <div className="rounded-lg border border-border bg-card mt-6 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                AI 标签学习
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                启用 AI 学习后，系统会根据你的手动标记自动分类新邮件。
              </p>
            </div>
            <span className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              adaptive
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-muted-foreground">准确率</span>
                <span className="text-foreground font-medium">87%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: '87%' }} />
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-md text-xs">重新训练</Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onClose={closeModal}>
        <DialogHeader>
          <DialogTitle>{editingTag ? '编辑标签' : '新建标签'}</DialogTitle>
          <DialogDescription>
            {editingTag ? '更新标签设置' : '创建新标签来组织邮件'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-xs">名称</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="标签名称"
              className="rounded-md mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">颜色</Label>
            <div className="flex gap-2 flex-wrap mt-1.5">
              {PRESET_COLORS.map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">描述（可选）</Label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="什么类型的邮件应该有这个标签？"
              className="rounded-md mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="aiEnabled"
              checked={formData.isAiEnabled}
              onChange={(e) => setFormData({ ...formData, isAiEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="aiEnabled" className="text-xs mb-0">启用 AI 自动分类</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeModal} className="rounded-md">取消</Button>
          <Button
            onClick={editingTag ? handleUpdateTag : handleCreateTag}
            disabled={!formData.name.trim()}
            className="rounded-md"
          >
            {editingTag ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
