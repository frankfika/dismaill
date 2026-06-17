import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { useEmailStore } from '../stores/email.store'
import { useEffect } from 'react'
import {
  Inbox,
  PenLine,
  MessageSquare,
  Tag,
  Settings,
  LogOut,
  Wallet,
} from 'lucide-react'

export default function Layout() {
  const { wallet, disconnect } = useAuthStore()
  const { loadAccounts } = useEmailStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (wallet?.address) {
      loadAccounts()
    }
  }, [loadAccounts, wallet?.address])

  const handleLogout = async () => {
    await disconnect()
    navigate('/')
  }

  const navItems = [
    { to: '/inbox', label: '收件箱', icon: Inbox },
    { to: '/compose', label: '写邮件', icon: PenLine },
    { to: '/chat', label: '聊天', icon: MessageSquare },
    { to: '/tags', label: '标签', icon: Tag },
    { to: '/settings', label: '设置', icon: Settings },
  ]

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        {/* Logo */}
        <div className="px-5 py-5">
          <h1 className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            NovaMail
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-active text-sidebar-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-active/60 hover:text-sidebar-foreground'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Wallet Info */}
        {wallet && (
          <div className="p-3 mx-3 mb-3 rounded-md bg-sidebar-active/40 border border-sidebar-border">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                <Wallet size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {wallet.ensName || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                </div>
                <div className="text-[11px] text-sidebar-foreground/50">Connected</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-active rounded transition-colors"
            >
              <LogOut size={12} />
              断开连接
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
