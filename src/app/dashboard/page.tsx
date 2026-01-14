'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react'
import { formatCurrency, daysSince, getStatusLabel } from '@/lib/utils'

interface Deal {
  id: string
  companyName: string
  schemeType: string
  investmentDate: string
  investmentAmount: number
  status: string
  createdAt: string
  founder?: {
    name: string
    email: string
  }
}

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

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

  const stats = {
    total: deals.length,
    awaitingAction: deals.filter(d =>
      ['AWAITING_ONBOARDING', 'ONBOARDING_COMPLETE', 'AWAITING_SUBMISSION'].includes(d.status)
    ).length,
    awaitingEIS2: deals.filter(d =>
      ['SUBMITTED', 'AWAITING_EIS2'].includes(d.status)
    ).length,
    completed: deals.filter(d => d.status === 'COMPLETE').length,
    overdue: deals.filter(d => {
      const days = daysSince(d.createdAt)
      return d.status === 'AWAITING_ONBOARDING' && days > 5
    }).length
  }

  const recentDeals = deals.slice(0, 5)

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of all EIS/SEIS deals</p>
        </div>
        <Link href="/dashboard/deals/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Deals
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Awaiting Action
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.awaitingAction}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Awaiting EIS2
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.awaitingEIS2}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {stats.overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">
                  {stats.overdue} deal{stats.overdue > 1 ? 's' : ''} overdue
                </p>
                <p className="text-sm text-red-600">
                  These deals haven't started onboarding after 5+ days
                </p>
              </div>
            </div>
            <Link href="/dashboard/deals?status=AWAITING_ONBOARDING">
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                View deals
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent deals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Deals</CardTitle>
          <Link href="/dashboard/deals">
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentDeals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No deals yet</p>
              <Link href="/dashboard/deals/new">
                <Button variant="link" className="mt-2">Create your first deal</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDeals.map(deal => (
                <Link
                  key={deal.id}
                  href={`/dashboard/deals/${deal.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">
                          {deal.companyName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{deal.companyName}</p>
                        <p className="text-sm text-gray-500">
                          {deal.founder?.name} · {formatCurrency(deal.investmentAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={deal.schemeType === 'SEIS' ? 'default' : 'secondary'}>
                        {deal.schemeType}
                      </Badge>
                      <Badge
                        variant={
                          deal.status === 'COMPLETE' ? 'success' :
                          deal.status === 'AWAITING_ONBOARDING' ? 'warning' :
                          'secondary'
                        }
                      >
                        {getStatusLabel(deal.status)}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
