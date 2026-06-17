import {
  Globe,
  Mail,
  Server,
  Wand2,
  Briefcase,
  MessageCircle,
  Phone,
  Megaphone,
  Shield,
  Heart,
  Sparkles,
  Book,
  Beaker,
} from 'lucide-react'
import type { AgentIcon } from '@shared/types/agent.types'
import type { ProviderPreset } from '@shared/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AGENT_ICONS: Record<AgentIcon, React.ComponentType<any>> = {
  wand: Wand2,
  briefcase: Briefcase,
  'message-circle': MessageCircle,
  phone: Phone,
  megaphone: Megaphone,
  shield: Shield,
  heart: Heart,
  sparkles: Sparkles,
  book: Book,
  flask: Beaker,
}

export const PROVIDER_REGIONS: Record<string, string> = { global: '国际', cn: '国内' }

export const CUSTOM_PROVIDER: ProviderPreset = {
  id: 'custom',
  name: '自定义 IMAP/SMTP',
  region: 'global',
  domains: [],
  imapHost: '',
  imapPort: 993,
  smtpHost: '',
  smtpPort: 465,
  supportsOauth: false,
  passwordHint: '使用邮箱登录密码；如启用 2FA，请使用应用专用密码 / 授权码',
  helpUrl: '',
}

export function providerIcon(p: string) {
  switch (p) {
    case 'gmail':
      return <Globe size={14} />
    case 'outlook':
      return <Mail size={14} />
    case 'icloud':
      return <Server size={14} />
    default:
      return <Mail size={14} />
  }
}
