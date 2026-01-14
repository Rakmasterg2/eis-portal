'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) throw new Error('Not authenticated')
        const data = await res.json()
        setUser(data.user)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Deals', href: '/dashboard/deals', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold">
                <span className="text-purple-600">Ascension</span>
              </h1>
            </div>
            <p className="px-4 text-xs text-gray-500 mt-1">EIS/SEIS Portal</p>

            {/* Navigation */}
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User section */}
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="ml-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">
            <span className="text-purple-600">Ascension</span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-b">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg',
                    isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-purple-600' : 'text-gray-400')} />
                  {item.name}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
