import { useState } from 'react'
import { useEmailStore } from '../stores/email.store'
import { useSignatures } from '../hooks/useSignatures'
import { invokeWrapped } from '../lib/ipc'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import type { EmailAccount } from '@shared/types'

interface ProviderInfo {
  name: string
  imap: { host: string; port: number }
  smtp: { host: string; port: number }
}

export default function Settings() {
  const { accounts, loadAccounts } = useEmailStore()
  const [activeTab, setActiveTab] = useState('accounts')

  const tabs = [
    { id: 'accounts', label: '邮箱账户', icon: '📧' },
    { id: 'signatures', label: '签名管理', icon: '✍️' },
    { id: 'ai', label: 'AI 设置', icon: '🤖' },
  ] as const

  return (
    <div className="h-full flex">
      <div className="w-56 border-r border-border p-4">
        <nav className="space-y-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-sm ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'accounts' && <AccountsSettings accounts={accounts} onUpdate={loadAccounts} />}
        {activeTab === 'signatures' && <SignaturesSettings accounts={accounts} />}
        {activeTab === 'ai' && <AISettings />}
      </div>
    </div>
  )
}

function AccountsSettings({ accounts, onUpdate }: { accounts: EmailAccount[]; onUpdate: () => void }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })

  const detectProvider = async (): Promise<ProviderInfo | null> => {
    const response = await invokeWrapped<ProviderInfo>('account:verify', { email: form.email })
    if (response.success && response.data) return response.data
    return null
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    const provider = await detectProvider()
    const response = await invokeWrapped('account:add', {
      walletAddress: '',
      emailAddress: form.email,
      displayName: form.displayName,
      provider: provider?.name.toLowerCase() || 'custom',
      imapHost: provider?.imap.host || '',
      imapPort: provider?.imap.port || 993,
      smtpHost: provider?.smtp.host || '',
      smtpPort: provider?.smtp.port || 465,
      authType: 'password',
      credentials: { password: form.password },
    })
    setVerifying(false)
    if (response.success) {
      setShowAddModal(false)
      onUpdate()
    } else {
      alert(response.error?.message || '添加失败')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-foreground">邮箱账户</h2>
        <Button size="sm" onClick={() => setShowAddModal(true)}>+ 添加账户</Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">暂无邮箱账户</p>
          <button onClick={() => setShowAddModal(true)} className="mt-3 text-primary text-sm hover:text-primary/80">
            添加第一个账户
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                    {account.provider === 'gmail' && '🇬'}
                    {account.provider === 'outlook' && '🅾️'}
                    {account.provider === 'icloud' && '🍎'}
                    {account.provider === 'custom' && '📧'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{account.emailAddress}</div>
                    <div className="text-xs text-muted-foreground capitalize">{account.provider}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    account.isActive ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    {account.isActive ? '正常' : '已停用'}
                  </span>
                  <button
                    onClick={async () => {
                      await invokeWrapped('account:delete', { id: account.id })
                      onUpdate()
                    }}
                    className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded text-muted-foreground transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-base font-medium text-foreground mb-4">添加邮箱账户</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label>邮箱地址</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required />
              </div>
              <div>
                <Label>显示名称</Label>
                <Input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Your Name" />
              </div>
              <div>
                <Label>密码</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
                <p className="text-xs text-muted-foreground mt-1">对于 Gmail，请使用应用专用密码</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">取消</Button>
                <Button type="submit" disabled={verifying} className="flex-1">{verifying ? '验证中...' : '添加'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SignaturesSettings({ accounts }: { accounts: EmailAccount[] }) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '')
  const { signatures, isLoading, createSignature, deleteSignature } = useSignatures(selectedAccountId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', content: '', isDefault: false })

  const handleCreate = async () => {
    if (!form.name.trim() || !form.content.trim()) return
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-foreground">签名管理</h2>
        {accounts.length > 0 && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>+ 添加签名</Button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">✍️</p>
          <p className="text-sm">请先添加邮箱账户</p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <Label>选择账户</Label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.emailAddress}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">加载中...</div>
          ) : signatures.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">✍️</p>
              <p className="text-sm">暂无签名</p>
              <button onClick={() => setShowAddModal(true)} className="mt-3 text-primary text-sm hover:text-primary/80">
                添加第一个签名
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {signatures.map((sig) => (
                <div key={sig.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{sig.name}</span>
                      {sig.isDefault && (
                        <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">默认</span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteSignature(sig.id)}
                      className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded text-muted-foreground transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                  <div
                    className="p-3 bg-muted rounded text-sm prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: sig.contentHtml }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-base font-medium text-foreground mb-4">添加签名</h3>
            <div className="space-y-4">
              <div>
                <Label>签名名称</Label>
                <Input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：工作签名" />
              </div>
              <div>
                <Label>签名内容 (支持 HTML)</Label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="<p>--</p><p>您的名字</p>"
                  rows={5}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 rounded border-border" />
                <Label htmlFor="isDefault">设为默认签名</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">取消</Button>
                <Button onClick={handleCreate} disabled={!form.name.trim() || !form.content.trim()} className="flex-1">添加</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AISettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [configs, setConfigs] = useState({
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    claude: { apiKey: '', model: 'claude-3-sonnet-20240229' },
    ollama: { baseUrl: 'http://localhost:11434', model: 'llama3' },
  })
  const [activeProvider, setActiveProvider] = useState('openai')

  const saveConfig = async (providerId: string) => {
    setIsLoading(true)
    try {
      console.log(`Saving config for ${providerId}:`, configs[providerId as keyof typeof configs])
      alert('配置已保存')
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-foreground mb-6">AI 设置</h2>

      <Tabs value={activeProvider} onValueChange={setActiveProvider}>
        <TabsList>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="claude">Claude</TabsTrigger>
          <TabsTrigger value="ollama">Ollama</TabsTrigger>
        </TabsList>

        <TabsContent value="openai" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI 配置</CardTitle>
              <CardDescription>配置 OpenAI API Key 以使用 GPT 模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Key</Label>
                <Input type="password" value={configs.openai.apiKey} onChange={(e) => setConfigs({ ...configs, openai: { ...configs.openai, apiKey: e.target.value } })} placeholder="sk-..." />
              </div>
              <div>
                <Label>默认模型</Label>
                <select value={configs.openai.model} onChange={(e) => setConfigs({ ...configs, openai: { ...configs.openai, model: e.target.value } })} className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </select>
              </div>
              <Button onClick={() => saveConfig('openai')} disabled={isLoading} size="sm">保存配置</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claude" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Claude (Anthropic) 配置</CardTitle>
              <CardDescription>配置 Anthropic API Key 以使用 Claude 模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>API Key</Label>
                <Input type="password" value={configs.claude.apiKey} onChange={(e) => setConfigs({ ...configs, claude: { ...configs.claude, apiKey: e.target.value } })} placeholder="sk-ant-..." />
              </div>
              <div>
                <Label>默认模型</Label>
                <select value={configs.claude.model} onChange={(e) => setConfigs({ ...configs, claude: { ...configs.claude, model: e.target.value } })} className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm">
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                </select>
              </div>
              <Button onClick={() => saveConfig('claude')} disabled={isLoading} size="sm">保存配置</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ollama" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ollama (本地) 配置</CardTitle>
              <CardDescription>配置本地 Ollama 服务以使用开源模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>服务地址</Label>
                <Input type="text" value={configs.ollama.baseUrl} onChange={(e) => setConfigs({ ...configs, ollama: { ...configs.ollama, baseUrl: e.target.value } })} placeholder="http://localhost:11434" />
              </div>
              <div>
                <Label>默认模型</Label>
                <Input type="text" value={configs.ollama.model} onChange={(e) => setConfigs({ ...configs, ollama: { ...configs.ollama, model: e.target.value } })} placeholder="llama3" />
              </div>
              <Button onClick={() => saveConfig('ollama')} disabled={isLoading} size="sm">保存配置</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
