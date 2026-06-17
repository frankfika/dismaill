import { useEffect, useState } from 'react'
import { useSignatures } from '../../hooks/useSignatures'
import { sanitizeHtml } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useDialogDismiss } from '../../hooks/useDialogDismiss'
import type { EmailAccount } from '@shared/types'
import { PenTool, Plus, Trash2 } from 'lucide-react'

export function SignaturesSettings({ accounts }: { accounts: EmailAccount[] }) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '')
  const { signatures, isLoading, createSignature, deleteSignature } = useSignatures(selectedAccountId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', content: '', isDefault: false })
  const closeAddModal = () => setShowAddModal(false)
  const addDialogRef = useDialogDismiss(closeAddModal, showAddModal)

  useEffect(() => {
    if (!selectedAccountId && accounts[0]) setSelectedAccountId(accounts[0].id)
  }, [accounts, selectedAccountId])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.content.trim() || !selectedAccountId) return
    const result = await createSignature({
      accountId: selectedAccountId,
      name: form.name,
      content: form.content,
      isDefault: form.isDefault,
    })
    if (result) {
      setShowAddModal(false)
      setForm({ name: '', content: '', isDefault: false })
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">签名管理</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">为不同账户维护多套签名模板</p>
        </div>
        {accounts.length > 0 && (
          <Button size="sm" onClick={() => setShowAddModal(true)} className="rounded-md gap-1.5">
            <Plus size={14} />
            添加签名
          </Button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-14 text-center text-muted-foreground">
          <PenTool size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">请先添加邮箱账户</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Label className="text-xs">选择账户</Label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.emailAddress}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">加载中...</div>
          ) : signatures.length === 0 ? (
            <div className="rounded-lg border border-border bg-card py-14 text-center text-muted-foreground">
              <PenTool size={32} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm">暂无签名</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-xs text-primary hover:text-primary/80"
              >
                添加第一个签名
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {signatures.map((sig) => (
                <div key={sig.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{sig.name}</span>
                      {sig.isDefault && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-medium">
                          默认
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteSignature(sig.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div
                    className="prose max-w-none rounded-md bg-muted/40 p-3 text-sm border border-border/50"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(sig.contentHtml) }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-signature-title"
          tabIndex={-1}
          ref={addDialogRef}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddModal()
          }}
        >
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
            <h3 id="add-signature-title" className="text-sm font-semibold text-foreground mb-4">添加签名</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">签名名称</Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：工作签名"
                  className="rounded-md mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">签名内容 (支持 HTML)</Label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="<p>--</p><p>您的名字</p>"
                  rows={5}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="isDefault" className="text-xs mb-0">
                  设为默认签名
                </Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 rounded-md">
                  取消
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!form.name.trim() || !form.content.trim()}
                  className="flex-1 rounded-md"
                >
                  添加
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
