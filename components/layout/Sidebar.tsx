'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, PhoneCall,
  ChevronLeft, ChevronRight, BarChart2, Users
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

// Assistants, Phone Numbers, Billing, and Settings are configuration, not
// analytics — Kite Dashboard's scope is read-only: calls, callers, numbers,
// names, summaries. Those pages still exist (unlinked) in case they're
// needed again later. Admin was removed entirely — company/assistant/user
// management now happens directly in the database.
const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calls', href: '/dashboard/calls', icon: PhoneCall },
  { label: 'Callers', href: '/dashboard/callers', icon: Users },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
]

interface SidebarProps {
  companyName: string
}

export function Sidebar({ companyName }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white border-r border-border transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo — Kite is the only brand; no per-customer white-labeling */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-border',
        collapsed && 'justify-center px-2'
      )}>
        {collapsed ? (
          <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center flex-shrink-0">
            <span className="text-background text-xs font-bold">K</span>
          </div>
        ) : (
          <Image
            src="/logo1.png"
            alt={companyName}
            width={64}
            height={37}
            className="object-contain"
            priority
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
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
