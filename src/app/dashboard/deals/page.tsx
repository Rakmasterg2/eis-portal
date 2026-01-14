'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react'
import { formatCurrency, formatDate, daysSince, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Deal {
  id: string
  companyName: string
  companyNumber: string
  schemeType: string
  investmentDate: string
  investmentAmount: number
  status: string
  createdAt: string
  founder?: {
    name: string
    email: string
    isHandlingSubmission: boolean
  }
  accountant?: {
    firmName: string
    contactName: string
    email: string
  }
  milestones?: { confirmedAt: string }[]
}

export default function DealsPage() {
  const searchParams = useSearchParams()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [schemeFilter, setSchemeFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch('/api/deals')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setDeals(data.deals)
      } catch (error) {
        console.error('Failed to fetch deals:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDeals()
  }, [])

  // Filter and sort deals
  const filteredDeals = deals
    .filter(deal => {
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !deal.companyName.toLowerCase().includes(searchLower) &&
          !deal.founder?.name.toLowerCase().includes(searchLower) &&
          !deal.companyNumber.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }
      if (statusFilter !== 'all' && deal.status !== statusFilter) return false
      if (schemeFilter !== 'all' && deal.schemeType !== schemeFilter) return false
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'company':
          comparison = a.companyName.localeCompare(b.companyName)
          break
        case 'amount':
          comparison = a.investmentAmount - b.investmentAmount
          break
        case 'date':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const toggleSort = (field: 'date' | 'company' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-500 mt-1">{filteredDeals.length} deals found</p>
        </div>
        <Link href="/dashboard/deals/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by company, founder, or company number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="AWAITING_ONBOARDING">Awaiting Onboarding</SelectItem>
                  <SelectItem value="ONBOARDING_COMPLETE">Onboarding Complete</SelectItem>
                  <SelectItem value="AWAITING_SUBMISSION">Awaiting Submission</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="AWAITING_EIS2">Awaiting EIS2</SelectItem>
                  <SelectItem value="EIS2_RECEIVED">EIS2 Received</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={schemeFilter} onValueChange={setSchemeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schemes</SelectItem>
                  <SelectItem value="SEIS">SEIS</SelectItem>
                  <SelectItem value="EIS">EIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals table */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
            <button
              onClick={() => toggleSort('company')}
              className="col-span-3 flex items-center gap-1 hover:text-gray-700"
            >
              Company
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <div className="col-span-2">Scheme</div>
            <button
              onClick={() => toggleSort('amount')}
              className="col-span-2 flex items-center gap-1 hover:text-gray-700"
            >
              Amount
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <div className="col-span-2">Status</div>
            <button
              onClick={() => toggleSort('date')}
              className="col-span-2 flex items-center gap-1 hover:text-gray-700"
            >
              Days
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <div className="col-span-1">Responsible</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDeals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No deals match your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredDeals.map(deal => {
                const days = daysSince(deal.createdAt)
                const isOverdue = deal.status === 'AWAITING_ONBOARDING' && days > 5
                const responsible = deal.founder?.isHandlingSubmission !== false
                  ? deal.founder?.name
                  : deal.accountant?.contactName || deal.founder?.name

                return (
                  <Link
                    key={deal.id}
                    href={`/dashboard/deals/${deal.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 p-4 items-center">
                      <div className="col-span-3">
                        <p className="font-medium text-gray-900">{deal.companyName}</p>
                        <p className="text-sm text-gray-500">{deal.founder?.name}</p>
                      </div>
                      <div className="col-span-2">
                        <Badge variant={deal.schemeType === 'SEIS' ? 'default' : 'secondary'}>
                          {deal.schemeType}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-gray-900">
                        {formatCurrency(deal.investmentAmount)}
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                          {getStatusLabel(deal.status)}
                        </span>
                      </div>
                      <div className={`col-span-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {days} days
                      </div>
                      <div className="col-span-1 text-sm text-gray-500 truncate">
                        {responsible}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
