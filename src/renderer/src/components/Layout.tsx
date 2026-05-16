import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { useEmailStore } from '../stores/email.store'
import { useEffect } from 'react'

export default function Layout() {
  const { wallet, disconnect } = useAuthStore()
  const { loadAccounts } = useEmailStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleLogout = async () => {
    await disconnect()
    navigate('/')
  }

  const navItems = [
    { to: '/inbox', label: '收件箱', icon: '📧' },
    { to: '/compose', label: '写邮件', icon: '✏️' },
    { to: '/chat', label: '聊天', icon: '💬' },
    { to: '/tags', label: '标签', icon: '🏷️' },
    { to: '/settings', label: '设置', icon: '⚙️' },
  ]

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border flex flex-col bg-muted/30">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <h1 className="text-xl font-semibold text-primary tracking-tight">
            Aura
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Wallet Info */}
        {wallet && (
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2.5 mb-2 px-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                {wallet.ensName?.[0]?.toUpperCase() || wallet.address[2]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {wallet.ensName || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-1.5 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              断开连接
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
