'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  PoundSterling,
  FileText,
  CheckCircle,
  Clock,
  Send,
  Download,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react'
import { formatCurrency, formatDate, daysSince, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Milestone {
  id: string
  milestoneType: string
  confirmedAt: string
  confirmedBy: string
  notes?: string
}

interface Note {
  id: string
  content: string
  createdAt: string
  createdBy: { name: string }
}

interface Deal {
  id: string
  companyName: string
  companyNumber: string
  schemeType: string
  investmentDate: string
  investmentAmount: number
  status: string
  createdAt: string
  completedAt?: string
  createdBy: { name: string }
  founder?: {
    id: string
    name: string
    email: string
    magicToken: string
    isHandlingSubmission: boolean
  }
  accountant?: {
    id: string
    firmName: string
    contactName: string
    email: string
    phone?: string
    magicToken: string
  }
  investors: {
    id: string
    name: string
    amountSubscribed: number
    sharesIssued: number
  }[]
  milestones: Milestone[]
  documents: {
    id: string
    documentType: string
    filename: string
    uploadedAt: string
  }[]
  notes: Note[]
}

export default function DealDetailPage() {
  const params = useParams()
  const dealId = params.id as string

  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDeal() {
      try {
        const res = await fetch(`/api/deals/${dealId}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setDeal(data.deal)
      } catch (error) {
        console.error('Failed to fetch deal:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDeal()
  }, [dealId])

  const copyMagicLink = async (token: string, type: string) => {
    const link = `${window.location.origin}/portal/${type}/${token}`
    await navigator.clipboard.writeText(link)
    setCopiedLink(type)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    setAddingNote(true)

    try {
      const res = await fetch(`/api/deals/${dealId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote })
      })

      if (!res.ok) throw new Error('Failed to add note')

      const data = await res.json()
      setDeal(prev => prev ? {
        ...prev,
        notes: [data.note, ...prev.notes]
      } : null)
      setNewNote('')
    } catch (error) {
      console.error('Failed to add note:', error)
    } finally {
      setAddingNote(false)
    }
  }

  const markComplete = async () => {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETE', completedAt: new Date().toISOString() })
      })

      if (!res.ok) throw new Error('Failed to update')

      const data = await res.json()
      setDeal(data.deal)
    } catch (error) {
      console.error('Failed to mark complete:', error)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Deal not found</p>
        <Link href="/dashboard/deals">
          <Button variant="link" className="mt-2">Back to deals</Button>
        </Link>
      </div>
    )
  }

  const days = daysSince(deal.createdAt)
  const responsible = deal.founder?.isHandlingSubmission !== false
    ? { type: 'Founder', name: deal.founder?.name, email: deal.founder?.email }
    : { type: 'Accountant', name: deal.accountant?.contactName, email: deal.accountant?.email, firm: deal.accountant?.firmName }

  const statusSteps = [
    { key: 'AWAITING_ONBOARDING', label: 'Welcome Sent' },
    { key: 'ONBOARDING_COMPLETE', label: 'Onboarding Complete' },
    { key: 'SUBMITTED', label: 'Submitted to HMRC' },
    { key: 'EIS2_RECEIVED', label: 'EIS2 Received' },
    { key: 'COMPLETE', label: 'Complete' }
  ]

  const currentStepIndex = statusSteps.findIndex(s => s.key === deal.status)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/deals" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Deals
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{deal.companyName}</h1>
            <Badge variant={deal.schemeType === 'SEIS' ? 'default' : 'secondary'}>
              {deal.schemeType}
            </Badge>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
              {getStatusLabel(deal.status)}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Created {formatDate(deal.createdAt)} · {days} days ago
          </p>
        </div>
        <div className="flex gap-2">
          {deal.status === 'EIS2_RECEIVED' && (
            <Button onClick={markComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      {/* Progress tracker */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCompleted ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}
                      ${isCurrent ? 'ring-2 ring-purple-300' : ''}
                    `}>
                      {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={`mt-2 text-xs ${isCompleted ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company & Investment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-400" />
                Deal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Company Number</p>
                  <a
                    href={`https://find-and-update.company-information.service.gov.uk/company/${deal.companyNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    {deal.companyNumber}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Investment Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(deal.investmentDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Investment Amount</p>
                  <p className="font-medium flex items-center gap-2">
                    <PoundSterling className="h-4 w-4 text-gray-400" />
                    {formatCurrency(deal.investmentAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Investors</p>
                  <p className="font-medium">{deal.investors.length} investor{deal.investors.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-purple-600"></div>
                  <div>
                    <p className="font-medium">Deal created</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(deal.createdAt)} by {deal.createdBy.name}
                    </p>
                  </div>
                </div>

                {deal.milestones.map(milestone => (
                  <div key={milestone.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-medium">
                        {milestone.milestoneType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(milestone.confirmedAt)} by {milestone.confirmedBy}
                        {milestone.notes && ` · ${milestone.notes}`}
                      </p>
                    </div>
                  </div>
                ))}

                {deal.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-gray-900"></div>
                    <div>
                      <p className="font-medium">Deal completed</p>
                      <p className="text-sm text-gray-500">{formatDate(deal.completedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal notes for the ops team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                />
                <Button onClick={addNote} disabled={addingNote || !newNote.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {deal.notes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
                ) : (
                  deal.notes.map(note => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {note.createdBy.name} · {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Responsible Party */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                Responsible Party
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-3">{responsible.type}</Badge>
              <p className="font-medium">{responsible.name}</p>
              {'firm' in responsible && responsible.firm && (
                <p className="text-sm text-gray-500">{responsible.firm}</p>
              )}
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {responsible.email}
              </p>
            </CardContent>
          </Card>

          {/* Founder */}
          {deal.founder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Founder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{deal.founder.name}</p>
                  <p className="text-sm text-gray-500">{deal.founder.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => copyMagicLink(deal.founder!.magicToken, 'founder')}
                >
                  {copiedLink === 'founder' ? (
                    <><Check className="h-3 w-3 mr-2" /> Copied!</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-2" /> Copy Magic Link</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Accountant */}
          {deal.accountant && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accountant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{deal.accountant.contactName}</p>
                  <p className="text-sm text-gray-500">{deal.accountant.firmName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {deal.accountant.email}
                  </p>
                  {deal.accountant.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {deal.accountant.phone}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => copyMagicLink(deal.accountant!.magicToken, 'accountant')}
                >
                  {copiedLink === 'accountant' ? (
                    <><Check className="h-3 w-3 mr-2" /> Copied!</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-2" /> Copy Magic Link</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deal.documents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No documents yet</p>
              ) : (
                <div className="space-y-2">
                  {deal.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-gray-500">
                          {doc.documentType.replace(/_/g, ' ')} · {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investors Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Investors ({deal.investors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deal.investors.map(investor => (
                  <div key={investor.id} className="flex justify-between text-sm">
                    <span className="text-gray-900">{investor.name}</span>
                    <span className="text-gray-500">{formatCurrency(investor.amountSubscribed)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
