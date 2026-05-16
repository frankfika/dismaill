import { useState } from 'react'
import { useTags } from '../hooks/useTags'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'

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
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-foreground">智能标签</h1>
            <p className="text-sm text-muted-foreground mt-1">使用 AI 自动分类邮件</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowCreateModal(true) }}
            size="sm"
          >
            + 新建标签
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🏷️</div>
            <p className="text-sm">暂无标签</p>
            <p className="text-xs mt-1">创建标签来组织邮件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="rounded-lg border border-border p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{tag.name}</h3>
                      {tag.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{tag.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {tag.isAiEnabled && (
                      <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">AI</span>
                    )}
                    <button onClick={() => openEditModal(tag)} className="p-1 text-muted-foreground hover:text-foreground">✏️</button>
                    <button onClick={() => handleDeleteTag(tag.id)} className="p-1 text-muted-foreground hover:text-destructive">🗑️</button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {tag.emailCount} 封邮件
                  </span>
                  <button className="text-primary hover:text-primary/80">查看邮件 →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Section */}
        <div className="mt-8 p-4 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-foreground mb-1">AI 标签学习</h3>
          <p className="text-xs text-muted-foreground mb-3">
            启用 AI 学习后，系统会根据你的手动标记自动分类新邮件。
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">准确率</span>
                <span className="text-foreground">87%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '87%' }} />
              </div>
            </div>
            <Button variant="outline" size="sm">重新训练</Button>
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
            <Label>名称</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="标签名称"
            />
          </div>

          <div>
            <Label>颜色</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>描述（可选）</Label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="什么类型的邮件应该有这个标签？"
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
            <Label htmlFor="aiEnabled" className="mb-0">启用 AI 自动分类</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>取消</Button>
          <Button
            onClick={editingTag ? handleUpdateTag : handleCreateTag}
            disabled={!formData.name.trim()}
          >
            {editingTag ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
