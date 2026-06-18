import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmailStore } from '../stores/email.store'
import { useSignatures } from '../hooks/useSignatures'
import { useSkills } from '../hooks/useSkills'
import { useAgents } from '../hooks/useAgents'
import { invoke } from '../lib/ipc'
import type { ReplySkill } from '@shared/types/skill.types'
import type { ReplyAgent } from '@shared/types/agent.types'
import { ComposeEditor } from './compose/ComposeEditor'
import { ComposeAIPanel } from './compose/ComposeAIPanel'

/**
 * Top-level Compose page. Owns all form state, the subject-debounced
 * auto-pick of agent/skill, and the submit/generate side effects.
 *
 * The actual UI is split into:
 *   - <ComposeEditor>: header + form fields + write/preview tabs
 *   - <ComposeAIPanel>: right-side AI Copilot (when toggled open)
 */
export default function Compose() {
  const navigate = useNavigate()
  const { accounts, selectedAccountId } = useEmailStore()
  const { skills } = useSkills()
  const { agents, recordUse: recordAgentUse } = useAgents()

  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [selectedSkillId, setSelectedSkillId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const [form, setForm] = useState({
    accountId: selectedAccountId || '',
    to: '',
    subject: '',
    body: '',
  })
  const [debouncedSubject, setDebouncedSubject] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSubject(form.subject), 300)
    return () => clearTimeout(t)
  }, [form.subject])

  const { signatures, getDefaultSignature } = useSignatures(form.accountId)
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('')

  useEffect(() => {
    const defaultSig = getDefaultSignature()
    setSelectedSignatureId(defaultSig?.id || '')
  }, [form.accountId, getDefaultSignature])

  // Auto-pick a matching agent (then a matching skill) from the subject.
  useEffect(() => {
    if (!debouncedSubject) return
    const subj = debouncedSubject.toLowerCase()
    if (agents.length > 0 && !selectedAgentId) {
      const match = agents.find((a) =>
        a.triggerCategories.some((c) => subj.includes(c.toLowerCase())),
      )
      if (match) {
        setSelectedAgentId(match.id)
        if (!selectedSkillId && match.defaultSkillId) {
          setSelectedSkillId(match.defaultSkillId)
        }
        return
      }
    }
    if (skills.length > 0 && !selectedSkillId) {
      const match = skills.find((s) =>
        s.triggerCategories.some((c) => subj.includes(c.toLowerCase())),
      )
      if (match) setSelectedSkillId(match.id)
    }
  }, [debouncedSubject, agents, skills, selectedAgentId, selectedSkillId])

  const selectedAgent: ReplyAgent | undefined = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId],
  )
  const selectedSkill: ReplySkill | undefined = useMemo(
    () => skills.find((s) => s.id === selectedSkillId),
    [skills, selectedSkillId],
  )

  const handleSubmit = async () => {
    if (!form.accountId || !form.to || !form.subject) return
    setSending(true)
    setSendError(null)
    try {
      let finalBody = form.body
      if (selectedSignatureId) {
        const signature = signatures.find((s) => s.id === selectedSignatureId)
        if (signature) {
          finalBody += `\n\n---\n${signature.contentHtml}`
        }
      }
      await invoke('email:send', {
        accountId: form.accountId,
        to: form.to.split(',').map((s) => s.trim()),
        cc: null,
        bcc: null,
        subject: form.subject,
        body: finalBody,
        bodyHtml: null,
        signatureId: selectedSignatureId || null,
        replyTo: null,
        attachments: null,
      })
      if (selectedAgent) recordAgentUse(selectedAgent.id)
      if (selectedSkill) {
        try {
          await invoke('skill:incr_use', { id: selectedSkill.id })
        } catch {
          /* analytics best-effort */
        }
      }
      navigate('/inbox')
    } catch (error) {
      setSendError(error instanceof Error ? error.message : '发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!aiInput.trim()) return
    setIsGenerating(true)
    setAiError(null)
    try {
      const resp = await invoke<{ content: string }>('ai:generate', {
        prompt: aiInput,
        agentId: selectedAgentId || null,
        templateId: null,
        context: null,
        provider: null,
        model: null,
        maxTokens: null,
        stream: null,
        requestId: null,
        skill: selectedSkill ?? null,
      })
      setForm((prev) => ({ ...prev, body: prev.body + (prev.body ? '\n\n' : '') + resp.content }))
      setAiInput('')
      setShowAIPanel(false)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <ComposeEditor
        form={form}
        onFormChange={setForm}
        accounts={accounts}
        agents={agents}
        skills={skills}
        signatures={signatures}
        selectedAgentId={selectedAgentId}
        selectedSkillId={selectedSkillId}
        selectedSignatureId={selectedSignatureId}
        onAgentChange={setSelectedAgentId}
        onSkillChange={setSelectedSkillId}
        onSignatureChange={setSelectedSignatureId}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        onToggleAIPanel={() => setShowAIPanel((v) => !v)}
        showAIPanel={showAIPanel}
        selectedAgent={selectedAgent}
        selectedSkill={selectedSkill}
        sending={sending}
        onCancel={() => navigate('/inbox')}
        onSend={handleSubmit}
        sendError={sendError}
      />
      <div className="flex">
        <div className="flex-1" />
        <ComposeAIPanel
          open={showAIPanel}
          onClose={() => setShowAIPanel(false)}
          agents={agents}
          skills={skills}
          selectedAgent={selectedAgent}
          selectedSkill={selectedSkill}
          prompt={aiInput}
          onPromptChange={setAiInput}
          isGenerating={isGenerating}
          onGenerate={handleAIGenerate}
          error={aiError}
        />
      </div>
    </div>
  )
}
