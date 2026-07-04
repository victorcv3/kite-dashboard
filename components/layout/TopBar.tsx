'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, ChevronRight } from 'lucide-react'

interface TopBarProps {
  userEmail: string
  userName: string | null
  companyName: string
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    calls: 'Calls',
    assistants: 'Assistants',
    'phone-numbers': 'Phone Numbers',
    settings: 'Settings',
    admin: 'Admin',
    companies: 'Companies',
  }

  let path = ''
  segments.forEach(seg => {
    path += `/${seg}`
    const isId = seg.length > 20 || seg.match(/^[0-9a-f-]{8,}$/i)
    crumbs.push({
      label: isId ? 'Detail' : (labelMap[seg] ?? seg),
      href: path,
    })
  })
  return crumbs
}

export function TopBar({ userEmail, userName, companyName }: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const crumbs = getBreadcrumbs(pathname)

  const initials = userName
    ? userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : userEmail[0].toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className={i === crumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none rounded-lg">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground hidden sm:block">{userName ?? userEmail}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium text-sm">{userName ?? 'Account'}</p>
            <p className="text-xs text-muted-foreground font-normal truncate">{userEmail}</p>
            <p className="text-xs text-muted-foreground font-normal">{companyName}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <User className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
