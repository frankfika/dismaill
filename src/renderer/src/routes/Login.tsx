import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignMessage } from 'wagmi'
import { useAuthStore } from '../stores/auth.store'
import { Button } from '../components/ui/button'
import { Sparkles, Shield, Zap, ArrowRight } from 'lucide-react'

type Mode = 'real' | 'demo'

const DEMO_MESSAGE =
  'Welcome to NovaMail. Sign this message to prove you own this wallet. No transaction will be made.'

export default function Login() {
  const navigate = useNavigate()
  const { connect, isConnecting, error, clearError, isConnected, wallet } = useAuthStore()
  const [mode, setMode] = useState<Mode>('demo')
  const [address, setAddress] = useState<string>('')
  const [ensName, setEnsName] = useState<string>('')
  const [step, setStep] = useState<'connect' | 'sign'>('connect')
  const [demoSig, setDemoSig] = useState<{ signature: string; message: string } | null>(null)
  const { signMessageAsync, isPending: isSigning } = useSignMessage()

  // In demo mode we just ask the user to type a wallet address and sign
  // locally. This keeps the app usable without installing MetaMask.
  useEffect(() => {
    if (isConnected && wallet?.address) {
      navigate('/inbox')
    }
  }, [isConnected, wallet?.address, navigate])

  const handleDemoConnect = () => {
    if (!address.trim()) return
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      clearError()
      // Address validation is only enforced in real mode; demo mode accepts any non-empty input.
    }
    setDemoSig({ signature: `demo-sig-${Date.now()}`, message: DEMO_MESSAGE })
    setStep('sign')
  }

  const handleDemoSubmit = async () => {
    if (!demoSig) return
    await connect({
      walletType: 'metamask',
      address: address.trim(),
      signature: demoSig.signature,
      message: demoSig.message,
      ensName: ensName || undefined,
    })
  }

  const handleRealConnect = async () => {
    if (!address.trim() || !/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      clearError()
      // TODO: show inline validation error instead of silent return
      return
    }
    setStep('sign')
    try {
      const message = DEMO_MESSAGE
      const signature = await signMessageAsync({ message })
      await connect({
        walletType: 'metamask',
        address: address.trim(),
        signature,
        message,
        ensName: ensName || undefined,
      })
    } catch (err) {
      // wagmi already throws user-facing error
      console.error('Sign failed:', err)
    }
  }

  const isWorking = isConnecting || isSigning

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-5xl grid gap-12 lg:grid-cols-2 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles size={12} />
            下一代 AI 邮箱工作台
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              用钱包进入
              <br />
              <span className="text-primary">AI 原生邮箱</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-md">
              统一管理邮箱、签名、标签、回复技能与 AI 助手。像原生应用一样轻盈，更懂现代工作流。
            </p>
          </div>

          <div className="grid gap-3">
            {[
              { icon: Shield, title: '钱包登录', desc: '签名鉴权，本地加密存储凭证' },
              { icon: Sparkles, title: 'AI Copilot', desc: '回复技能 + 多模型协作' },
              { icon: Zap, title: '本地优先', desc: '离线可读，恢复后自动同步' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <div className="mt-0.5 text-primary">
                  <item.icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles size={24} />
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">NovaMail</h2>
              <p className="mt-1 text-sm text-muted-foreground">去中心化 AI 邮箱客户端</p>
            </div>

            {/* Mode tabs */}
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted/30 p-1 text-xs">
              <button
                onClick={() => {
                  setMode('demo')
                  setStep('connect')
                }}
                className={`rounded px-2 py-1.5 ${
                  mode === 'demo' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                快速体验（演示模式）
              </button>
              <button
                onClick={() => {
                  setMode('real')
                  setStep('connect')
                }}
                className={`rounded px-2 py-1.5 ${
                  mode === 'real' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                真实钱包登录
              </button>
            </div>

            {step === 'connect' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">钱包地址</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x…"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">ENS（可选）</label>
                  <input
                    value={ensName}
                    onChange={(e) => setEnsName(e.target.value)}
                    placeholder="yourname.eth"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                {(error) && (
                  <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  onClick={mode === 'demo' ? handleDemoConnect : handleRealConnect}
                  disabled={!address.trim() || isWorking}
                  className="w-full rounded-md gap-1.5"
                >
                  {isWorking ? '处理中…' : '继续'}
                  <ArrowRight size={14} />
                </Button>
                <button
                  onClick={async () => {
                    clearError()
                    await connect({
                      walletType: 'metamask',
                      address: '0xdemo' + Math.random().toString(16).slice(2, 8).padEnd(40, '0'),
                      signature: 'demo',
                      message: 'demo',
                    })
                  }}
                  className="w-full py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  跳过登录，以游客模式体验
                </button>
              </div>
            )}

            {step === 'sign' && mode === 'demo' && (
              <div className="space-y-3">
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                    待签名消息
                  </div>
                  <p className="text-xs text-foreground font-mono leading-relaxed">{DEMO_MESSAGE}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  演示模式：点击下方"完成登录"即可进入应用。真实模式下需用钱包签名。
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('connect')} className="flex-1 rounded-md">
                    返回
                  </Button>
                  <Button
                    onClick={handleDemoSubmit}
                    disabled={isWorking}
                    className="flex-1 rounded-md"
                  >
                    {isWorking ? '登录中…' : '完成登录'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
