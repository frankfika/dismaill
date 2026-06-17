import { useState } from 'react'
import { useEmailStore } from '../stores/email.store'
import { Mail, PenTool, Bot, Sparkles, Wand2 } from 'lucide-react'
import { AccountsSettings } from './settings/AccountsSettings'
import { SignaturesSettings } from './settings/SignaturesSettings'
import { AgentsSettings } from './settings/AgentsSettings'
import { SkillsSettings } from './settings/SkillsSettings'
import { AISettings } from './settings/AISettings'

export default function Settings() {
  const { accounts, loadAccounts } = useEmailStore()
  const [activeTab, setActiveTab] = useState('accounts')

  const tabs = [
    { id: 'accounts', label: '邮箱账户', icon: Mail },
    { id: 'signatures', label: '签名管理', icon: PenTool },
    { id: 'agents', label: 'AI 角色', icon: Sparkles },
    { id: 'skills', label: '回复技能', icon: Wand2 },
    { id: 'ai', label: 'AI 设置', icon: Bot },
  ] as const

  return (
    <div className="h-full flex bg-background">
      <div className="w-56 shrink-0 border-r border-border p-4 bg-sidebar">
        <div className="mb-5">
          <h1 className="text-sm font-semibold text-sidebar-foreground">设置中心</h1>
          <p className="mt-0.5 text-xs text-sidebar-foreground/60">账户、签名、技能与 AI 能力</p>
        </div>
        <nav className="space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-sidebar-active text-sidebar-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-active/60 hover:text-sidebar-foreground'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'accounts' && <AccountsSettings accounts={accounts} onUpdate={loadAccounts} />}
        {activeTab === 'signatures' && <SignaturesSettings accounts={accounts} />}
        {activeTab === 'agents' && <AgentsSettings />}
        {activeTab === 'skills' && <SkillsSettings />}
        {activeTab === 'ai' && <AISettings />}
      </div>
    </div>
  )
}
