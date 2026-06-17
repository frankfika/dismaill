import { useEffect, useMemo, useState } from 'react'
import { invokeWrapped, invoke } from '../../lib/ipc'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useDialogDismiss } from '../../hooks/useDialogDismiss'
import type { EmailAccount, ProviderPreset } from '@shared/types'
import { Mail, Plus, Trash2, X, AlertCircle, ExternalLink } from 'lucide-react'
import { PROVIDER_REGIONS, CUSTOM_PROVIDER, providerIcon } from './constants'

export function AccountsSettings({ accounts, onUpdate }: { accounts: EmailAccount[]; onUpdate: () => void }) {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">邮箱账户</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">连接主流邮箱并保持同步</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="rounded-md gap-1.5">
          <Plus size={14} />
          添加账户
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-14 text-center text-muted-foreground">
          <Mail size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">暂无邮箱账户</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-xs text-primary hover:text-primary/80"
          >
            添加第一个账户
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {providerIcon(account.provider)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{account.emailAddress}</div>
                    <div className="text-[11px] capitalize text-muted-foreground">
                      {account.displayName ? `${account.displayName} · ` : ''}
                      {account.provider} · IMAP {account.imapHost}:{account.imapPort}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                      account.isActive
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {account.isActive ? '正常' : '已停用'}
                  </span>
                  <button
                    onClick={async () => {
                      await invokeWrapped('account:delete', { id: account.id })
                      onUpdate()
                    }}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddAccountModal onClose={() => setShowAddModal(false)} onAdded={onUpdate} />}
    </div>
  )
}

function AddAccountModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const dialogRef = useDialogDismiss(onClose, true)
  const [presets, setPresets] = useState<ProviderPreset[]>([])
  const [selected, setSelected] = useState<ProviderPreset | null>(null)
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    password: '',
    imapHost: '',
    imapPort: 993,
    smtpHost: '',
    smtpPort: 465,
  })
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    invoke<ProviderPreset[]>('account:list_providers')
      .then((list) => {
        setPresets(list)
        setSelected(CUSTOM_PROVIDER)
      })
      .catch((e) => setError(String(e)))
  }, [])

  // Auto-detect provider when the user has finished typing an email.
  useEffect(() => {
    if (!form.email || !form.email.includes('@') || presets.length === 0) return
    const t = setTimeout(async () => {
      const detected = await invoke<ProviderPreset | null>('account:detect_provider', {
        email: form.email,
      })
      if (detected) {
        setSelected(detected)
        setForm((f) => ({
          ...f,
          imapHost: detected.imapHost,
          imapPort: detected.imapPort,
          smtpHost: detected.smtpHost,
          smtpPort: detected.smtpPort,
        }))
      }
    }, 300)
    return () => clearTimeout(t)
  }, [form.email, presets])

  // Update IMAP/SMTP fields when the user picks a different preset.
  useEffect(() => {
    if (!selected || selected.id === 'custom') return
    setForm((f) => ({
      ...f,
      imapHost: selected.imapHost,
      imapPort: selected.imapPort,
      smtpHost: selected.smtpHost,
      smtpPort: selected.smtpPort,
    }))
  }, [selected])

  const handleTest = async () => {
    if (!form.email || !form.password) {
      setError('请先填写邮箱和密码 / 授权码')
      return
    }
    setTesting(true)
    setTestResult(null)
    setError(null)
    try {
      const res = await invokeWrapped<boolean>('account:verify', {
        imapHost: form.imapHost,
        imapPort: Number(form.imapPort),
        smtpHost: form.smtpHost,
        smtpPort: Number(form.smtpPort),
        username: form.email,
        password: form.password,
      })
      if (res.success) {
        setTestResult({ ok: true, message: '连接成功！可以保存账户' })
      } else {
        setTestResult({ ok: false, message: res.error?.message || '连接失败' })
      }
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : '测试失败' })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('请填写邮箱和密码 / 授权码')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await invokeWrapped<EmailAccount>('account:add', {
        emailAddress: form.email,
        displayName: form.displayName || null,
        provider: selected?.id || 'custom',
        imapHost: form.imapHost,
        imapPort: Number(form.imapPort),
        smtpHost: form.smtpHost,
        smtpPort: Number(form.smtpPort),
        authType: 'password',
        password: form.password,
        oauthToken: null,
      })
      if (res.success) {
        onAdded()
        onClose()
      } else {
        setError(res.error?.message || '添加失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const grouped = useMemo(() => {
    const out: Record<string, ProviderPreset[]> = { 国际: [], 国内: [], 自定义: [CUSTOM_PROVIDER] }
    for (const p of presets) {
      const key = PROVIDER_REGIONS[p.region] || '其他'
      if (!out[key]) out[key] = []
      out[key].push(p)
    }
    return out
  }, [presets])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-account-title"
      tabIndex={-1}
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 id="add-account-title" className="text-base font-semibold text-foreground">添加邮箱账户</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              选一个服务商，配置会自动填好
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Provider picker */}
          <div>
            <Label className="text-xs">邮箱服务商</Label>
            <div className="mt-2 space-y-3">
              {Object.entries(grouped).map(([region, list]) => (
                <div key={region}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                    {region}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {list.map((p) => {
                      const active = selected?.id === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelected(p)}
                          className={`text-left rounded-md border p-2.5 transition-colors ${
                            active
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-border hover:border-border/80 bg-card'
                          }`}
                        >
                          <div className="text-xs font-medium text-foreground truncate">{p.name}</div>
                          {p.domains.length > 0 && (
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {p.domains[0]}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email + display name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">邮箱地址</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="rounded-md mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">显示名称</Label>
              <Input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Your Name"
                className="rounded-md mt-1"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label className="text-xs">
              密码 / 授权码 {selected?.id !== 'custom' && selected?.passwordHint && (
                <span className="text-muted-foreground font-normal ml-1">— {selected.passwordHint}</span>
              )}
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              className="rounded-md mt-1"
            />
            {selected?.helpUrl && (
              <a
                href={selected.helpUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                如何获取应用专用密码 / 授权码？
                <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* IMAP / SMTP */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">服务器设置</Label>
              {selected?.id === 'custom' && (
                <span className="text-[10px] text-muted-foreground">自定义模式：手动填写 IMAP/SMTP</span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">IMAP 主机</Label>
                <Input
                  value={form.imapHost}
                  onChange={(e) => setForm({ ...form, imapHost: e.target.value })}
                  placeholder="imap.example.com"
                  className="rounded-md mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">IMAP 端口</Label>
                <Input
                  type="number"
                  value={form.imapPort}
                  onChange={(e) => {
                    const port = Number(e.target.value)
                    setForm({ ...form, imapPort: Number.isNaN(port) || port <= 0 ? form.imapPort : port })
                  }}
                  className="rounded-md mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">SMTP 主机</Label>
                <Input
                  value={form.smtpHost}
                  onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                  placeholder="smtp.example.com"
                  className="rounded-md mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">SMTP 端口</Label>
                <Input
                  type="number"
                  value={form.smtpPort}
                  onChange={(e) => {
                    const port = Number(e.target.value)
                    setForm({ ...form, smtpPort: Number.isNaN(port) || port <= 0 ? form.smtpPort : port })
                  }}
                  className="rounded-md mt-1"
                />
              </div>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${
                testResult.ok
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                  : 'border-destructive/20 bg-destructive/10 text-destructive'
              }`}
            >
              {testResult.message}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || submitting}
              className="flex-1 rounded-md"
            >
              {testing ? '测试中…' : '测试连接'}
            </Button>
            <Button
              type="submit"
              disabled={testing || submitting}
              className="flex-1 rounded-md"
            >
              {submitting ? '添加中…' : '保存账户'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
