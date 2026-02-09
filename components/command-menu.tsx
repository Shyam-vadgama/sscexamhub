'use client'

import * as React from 'react'
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  FileText,
  BarChart,
  Database,
  Image as ImageIcon,
  Bell,
  Flag,
  History
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from 'cmdk'
import { useRouter } from 'next/navigation'

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setOpen(false)} />
        <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-white p-0 shadow-2xl duration-200 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <CommandInput 
            placeholder="Type a command or search..." 
            className="flex h-11 w-full rounded-md bg-transparent py-3 px-4 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No results found.</CommandEmpty>
            <CommandGroup heading="Main" className="text-slate-500 p-1">
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/users'))} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Users</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/analytics'))} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer">
                <BarChart className="mr-2 h-4 w-4" />
                <span>Analytics</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/materials'))} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Materials</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className="my-1 h-px bg-slate-200" />
            <CommandGroup heading="Engagement" className="text-slate-500 p-1">
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/banners'))} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer">
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>App Banners</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/notifications'))} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/reports'))} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer">
                <Flag className="mr-2 h-4 w-4" />
                <span>User Reports</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className="my-1 h-px bg-slate-200" />
            <CommandGroup heading="System" className="text-slate-500 p-1">
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/logs'))} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer">
                <History className="mr-2 h-4 w-4" />
                <span>Audit Logs</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut className="ml-auto text-xs tracking-widest text-slate-500">⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </div>
      </CommandDialog>
    </>
  )
}
