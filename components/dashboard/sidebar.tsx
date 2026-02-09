'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Settings,
  BarChart3,
  MessageSquare,
  Shield,
  Upload,
  Database,
  ListTodo,
  Newspaper,
  Bell,
  Image as ImageIcon,
  Flag,
  History
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'News Feed',
    href: '/dashboard/news',
    icon: Newspaper,
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'Tests',
    href: '/dashboard/tests',
    icon: FileText,
  },
  {
    name: 'Questions',
    href: '/dashboard/questions',
    icon: MessageSquare,
  },
  {
    name: 'Study Materials',
    href: '/dashboard/materials',
    icon: BookOpen,
  },
  {
    name: 'Study Templates',
    href: '/dashboard/templates',
    icon: ListTodo,
  },
  {
    name: 'App Banners',
    href: '/dashboard/banners',
    icon: ImageIcon,
  },
  {
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    name: 'User Reports',
    href: '/dashboard/reports',
    icon: Flag,
  },
  {
    name: 'Audit Logs',
    href: '/dashboard/logs',
    icon: History,
  },
  {
    name: 'Content Upload',
    href: '/dashboard/upload',
    icon: Upload,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Database',
    href: '/dashboard/database',
    icon: Database,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  className?: string
  onClose?: () => void
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("w-64 bg-white border-r border-gray-200 flex flex-col h-full", className)}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 justify-between">
        <div className="flex items-center">
          <Shield className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="font-bold text-lg text-gray-900">SSC Exam Hub</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
        {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
            </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center px-3 py-2.5 mb-1 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 mr-3',
                isActive ? 'text-blue-700' : 'text-gray-400'
              )} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  )
}
