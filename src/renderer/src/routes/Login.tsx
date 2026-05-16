import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnect, useAccount, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import { useAuthStore } from '../stores/auth.store'
import { invokeWrapped } from '../lib/ipc'
import { Button } from '../components/ui/button'

type WalletType = 'metamask' | 'walletconnect' | 'coinbase'

const WALLETS = [
  { id: 'metamask' as WalletType, name: 'MetaMask', icon: '🦊' },
  { id: 'walletconnect' as WalletType, name: 'WalletConnect', icon: '🔗' },
  { id: 'coinbase' as WalletType, name: 'Coinbase Wallet', icon: '💰' },
]

export default function Login() {
  const [selectedWallet, setSelectedWallet] = useState<WalletType>('metamask')
  const { connect, isPending, error: connectError } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined })
  const navigate = useNavigate()
  const { setWallet, isConnecting, setConnecting, setError, error, clearError } = useAuthStore()

  useEffect(() => {
    if (isConnected && address) {
      const syncWallet = async () => {
        try {
          setConnecting(true)
          const response = await invokeWrapped('auth:connect', {
            walletType: selectedWallet,
            address,
            ensName: ensName || undefined,
            avatarUrl: ensAvatar || undefined,
          })

          if (response.success && response.data) {
            setWallet({
              address,
              ensName: ensName || undefined,
              avatarUrl: ensAvatar || undefined,
            })
            navigate('/inbox')
          } else {
            setError(response.error?.message || 'Failed to sync wallet')
            disconnect()
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Connection failed')
          disconnect()
        } finally {
          setConnecting(false)
        }
      }
      syncWallet()
    }
  }, [isConnected, address, ensName, ensAvatar, selectedWallet, setWallet, setConnecting, setError, disconnect, navigate])

  const handleConnect = async () => {
    clearError()
    try {
      let connector
      switch (selectedWallet) {
        case 'metamask':
          connector = injected({ target: 'metaMask' })
          break
        case 'walletconnect':
          connector = walletConnect({
            projectId: import.meta.env.VITE_WC_PROJECT_ID || 'demo',
          })
          break
        case 'coinbase':
          connector = coinbaseWallet({ appName: 'Aura Email Client' })
          break
      }
      connect({ connector })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    }
  }

  const handleSkipLogin = () => navigate('/inbox')

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold text-primary tracking-tight">Aura</h1>
          <p className="mt-2 text-sm text-muted-foreground">去中心化 AI 邮箱客户端</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          {isConnected && address ? (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-medium">
                {(ensName || address).slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-lg font-medium text-foreground mb-1">
                {ensName || truncateAddress(address)}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">钱包已连接</p>
              {isConnecting ? (
                <div className="flex items-center justify-center gap-2 text-primary text-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  同步中...
                </div>
              ) : (
                <Button onClick={() => disconnect()} variant="outline" className="w-full">
                  断开连接
                </Button>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-base font-medium text-foreground mb-4">选择钱包</h2>

              <div className="space-y-2">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => setSelectedWallet(wallet.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition-all ${
                      selectedWallet === wallet.id
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border hover:border-primary/30 text-foreground'
                    }`}
                  >
                    <span className="text-xl">{wallet.icon}</span>
                    <span className="font-medium">{wallet.name}</span>
                    {selectedWallet === wallet.id && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              {(error || connectError) && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error || connectError?.message}
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={isPending || isConnecting}
                className="w-full mt-5"
              >
                {isPending || isConnecting ? '连接中...' : '连接钱包'}
              </Button>

              <button
                onClick={handleSkipLogin}
                className="w-full mt-3 py-2 text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                跳过登录，以游客模式体验
              </button>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { label: '钱包登录', desc: '无需密码' },
            { label: 'AI 辅助', desc: '智能撰写' },
            { label: '离线可用', desc: '本地优先' },
          ].map((f) => (
            <div key={f.label} className="text-muted-foreground">
              <div className="text-xs font-medium text-foreground">{f.label}</div>
              <div className="text-xs mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
