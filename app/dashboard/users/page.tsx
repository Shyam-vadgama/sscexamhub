'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Filter, Download, Eye, Edit, Trash, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { logAction } from '@/lib/logger'

interface User {
  id: string
  phone: string
  email: string | null
  name: string | null
  plan: string
  exam_type: string | null
  coins: number
  streak_days: number
  created_at: string
  last_active_date: string | null
}

function UsersPageContent() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const pageSize = 20

  // Get sort params from URL or default
  const sortColumn = searchParams.get('sort') || 'created_at'
  const sortOrder = searchParams.get('order') || 'desc'

  const handleSort = (column: string) => {
    const newOrder = column === sortColumn && sortOrder === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams(searchParams)
    params.set('sort', column)
    params.set('order', newOrder)
    router.push(`${pathname}?${params.toString()}`)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1 text-gray-900" /> : 
      <ArrowDown className="w-4 h-4 ml-1 text-gray-900" />
  }

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order(sortColumn, { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

      // Apply filters
      if (filterPlan !== 'all') {
        query = query.eq('plan', filterPlan)
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      setUsers(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error: any) {
      toast.error('Failed to load users')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, currentPage, filterPlan, searchQuery, pageSize, sortColumn, sortOrder])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      await logAction('DELETE_USER', 'users', userId, { deleted_by: 'admin' })
      toast.success('User deleted successfully')
      loadUsers()
    } catch (error: any) {
      toast.error('Failed to delete user')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(users.map(u => u.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', selectedIds)

      if (error) throw error

      await logAction('BULK_DELETE_USERS', 'users', null, { count: selectedIds.length, ids: selectedIds })
      toast.success(`${selectedIds.length} users deleted successfully`)
      setSelectedIds([])
      loadUsers()
    } catch (error: any) {
      toast.error('Failed to delete users')
    }
  }

  const exportUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order(sortColumn, { ascending: sortOrder === 'asc' })
        .csv()

      if (error) throw error

      // Create download link
      const blob = new Blob([data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-${new Date().toISOString()}.csv`
      a.click()

      toast.success('Users exported successfully')
    } catch (error) {
      toast.error('Failed to export users')
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-purple-100 text-purple-700'
      case 'free':
        return 'bg-green-100 text-green-700'
      case 'guest':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">
            Manage all registered users
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={bulkDelete}>
              <Trash className="w-4 h-4 mr-2" />
              Delete ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={exportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Plan Filter */}
          <div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          {/* Refresh Button */}
          <Button variant="outline" onClick={loadUsers}>
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 w-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        User
                        <SortIcon column="name" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center">
                        Contact
                        <SortIcon column="phone" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('plan')}
                    >
                      <div className="flex items-center">
                        Plan
                        <SortIcon column="plan" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('exam_type')}
                    >
                      <div className="flex items-center">
                        Exam
                        <SortIcon column="exam_type" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('coins')}
                    >
                      <div className="flex items-center">
                        Stats
                        <SortIcon column="coins" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Joined
                        <SortIcon column="created_at" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name || 'No name'}
                          </p>
                          <p className="text-sm text-gray-500 font-mono">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{user.phone}</p>
                          {user.email && (
                            <p className="text-sm text-gray-500">{user.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeColor(user.plan)}`}>
                          {user.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.exam_type || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            🪙 {user.coins} coins
                          </p>
                          <p className="text-gray-500">
                            🔥 {user.streak_days} days
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/dashboard/users/${user.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete user"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UsersPageContent />
    </Suspense>
  )
}