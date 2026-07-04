'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, PhoneCall, Bot, Phone, Settings, ShieldCheck,
  ChevronLeft, ChevronRight, CreditCard, BarChart2
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calls', href: '/dashboard/calls', icon: PhoneCall },
  { label: 'Assistants', href: '/dashboard/assistants', icon: Bot },
  { label: 'Phone Numbers', href: '/dashboard/phone-numbers', icon: Phone },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Admin', href: '/admin', icon: ShieldCheck, adminOnly: true },
]

interface SidebarProps {
  isAdmin: boolean
  companyName: string
  brandColor: string
  logoUrl?: string | null
}

export function Sidebar({ isAdmin, companyName, brandColor, logoUrl }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const items = navItems.filter(item => !item.adminOnly || isAdmin)

  // Use brand color for active state only when client has a custom color set
  const hasCustomBrand = brandColor && brandColor !== '#6366f1' && brandColor !== '#000000'

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white border-r border-border transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-border',
        collapsed && 'justify-center px-2'
      )}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={companyName}
            className={cn('object-contain flex-shrink-0', collapsed ? 'h-7 w-7' : 'h-8')}
          />
        ) : collapsed ? (
          <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center flex-shrink-0">
            <span className="text-background text-xs font-bold">K</span>
          </div>
        ) : (
          <Image
            src="/logo1.png"
            alt="Kite"
            width={64}
            height={37}
            className="object-contain"
            priority
          />
        )}
        {!collapsed && !logoUrl && null}
        {!collapsed && logoUrl && (
          <span className="font-semibold text-sm text-foreground truncate">{companyName}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {items.map(({ label, href, icon: Icon }) => {
          const isActive = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              style={isActive && hasCustomBrand ? { backgroundColor: brandColor, color: '#fff' } : undefined}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
          : <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        }
      </button>
    </aside>
  )
}
