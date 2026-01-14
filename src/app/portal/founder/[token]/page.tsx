'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  Circle,
  Download,
  Upload,
  ExternalLink,
  User,
  Building2,
  FileText,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils'

interface Deal {
  id: string
  companyName: string
  companyNumber: string
  schemeType: string
  investmentDate: string
  investmentAmount: number
  status: string
  investors: {
    id: string
    name: string
    addressLine1: string
    addressLine2?: string
    city: string
    postcode: string
    country: string
    amountSubscribed: number
    sharesIssued: number
    shareIssueDate: string
    shareClass: string
  }[]
  milestones: {
    milestoneType: string
    confirmedAt: string
  }[]
  accountant?: {
    firmName: string
    contactName: string
  }
}

interface Founder {
  id: string
  name: string
  email: string
  isHandlingSubmission: boolean
}

type Step = 'onboarding' | 'data' | 'submission' | 'eis2' | 'complete'

export default function FounderPortalPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deal, setDeal] = useState<Deal | null>(null)
  const [founder, setFounder] = useState<Founder | null>(null)

  // Form states
  const [isHandlingSelf, setIsHandlingSelf] = useState<boolean | null>(null)
  const [accountantForm, setAccountantForm] = useState({
    firmName: '',
    contactName: '',
    email: '',
    phone: '',
    hasBeenBriefed: false,
    hasInvestorData: false
  })
  const [submissionDate, setSubmissionDate] = useState('')
  const [uploadingEIS2, setUploadingEIS2] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function fetchDeal() {
      try {
        const res = await fetch(`/api/portal/${token}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Invalid or expired link')
        }
        const data = await res.json()
        setDeal(data.deal)
        setFounder(data.founder)
        setIsHandlingSelf(data.founder.isHandlingSubmission)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchDeal()
  }, [token])

  const getCurrentStep = (): Step => {
    if (!deal) return 'onboarding'
    switch (deal.status) {
      case 'AWAITING_ONBOARDING':
        return 'onboarding'
      case 'ONBOARDING_COMPLETE':
      case 'AWAITING_SUBMISSION':
        return 'data'
      case 'SUBMITTED':
      case 'AWAITING_EIS2':
        return 'eis2'
      case 'EIS2_RECEIVED':
      case 'COMPLETE':
        return 'complete'
      default:
        return 'onboarding'
    }
  }

  const completeOnboarding = async () => {
    setProcessing(true)
    try {
      if (isHandlingSelf === false) {
        // Add accountant first
        await fetch(`/api/portal/${token}/accountant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountantForm)
        })
      }

      // Complete onboarding
      await fetch(`/api/portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_onboarding',
          data: { isHandlingSubmission: isHandlingSelf }
        })
      })

      // Refetch deal
      const res = await fetch(`/api/portal/${token}`)
      const data = await res.json()
      setDeal(data.deal)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  const confirmSubmission = async () => {
    setProcessing(true)
    try {
      await fetch(`/api/portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_submission',
          data: { submissionDate }
        })
      })

      const res = await fetch(`/api/portal/${token}`)
      const data = await res.json()
      setDeal(data.deal)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  const uploadEIS2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingEIS2(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'EIS2')

      await fetch(`/api/portal/${token}/upload`, {
        method: 'POST',
        body: formData
      })

      const res = await fetch(`/api/portal/${token}`)
      const data = await res.json()
      setDeal(data.deal)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploadingEIS2(false)
    }
  }

  const downloadInvestorSchedule = () => {
    if (!deal) return

    const headers = ['Investor Name', 'Address Line 1', 'Address Line 2', 'City', 'Postcode', 'Country', 'Shares Issued', 'Amount Subscribed', 'Share Issue Date', 'Share Class']
    const rows = deal.investors.map(inv => [
      inv.name,
      inv.addressLine1,
      inv.addressLine2 || '',
      inv.city,
      inv.postcode,
      inv.country,
      inv.sharesIssued.toString(),
      inv.amountSubscribed.toString(),
      new Date(inv.shareIssueDate).toLocaleDateString('en-GB'),
      inv.shareClass
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deal.companyName.replace(/\s+/g, '_')}_Investor_Schedule.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Error</h2>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!deal || !founder) return null

  const currentStep = getCurrentStep()

  const steps = [
    { key: 'onboarding', label: 'Get Started', number: 1 },
    { key: 'data', label: 'Review Data', number: 2 },
    { key: 'submission', label: 'Submit to HMRC', number: 3 },
    { key: 'eis2', label: 'Receive EIS2', number: 4 },
    { key: 'complete', label: 'Complete', number: 5 }
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-purple-600">Ascension</span>
              </h1>
              <p className="text-sm text-gray-500">EIS/SEIS Compliance Portal</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{deal.companyName}</p>
              <div className="flex items-center gap-2 justify-end">
                <Badge variant={deal.schemeType === 'SEIS' ? 'default' : 'secondary'}>
                  {deal.schemeType}
                </Badge>
                <span className="text-sm text-gray-500">{formatCurrency(deal.investmentAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCompleted = index < currentStepIndex
                const isCurrent = index === currentStepIndex
                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${isCompleted ? 'bg-purple-600' : isCurrent ? 'bg-purple-600' : 'bg-gray-200'}
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <span className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                            {step.number}
                          </span>
                        )}
                      </div>
                      <span className={`mt-2 text-xs text-center ${isCurrent ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 md:w-20 h-0.5 mx-1 md:mx-2 ${index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Welcome / Onboarding */}
        {currentStep === 'onboarding' && (
          <div className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {founder.name}!</CardTitle>
                <CardDescription>
                  Let's get your investors their tax relief certificates. This process is straightforward - we'll guide you through each step.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="font-medium text-purple-900 mb-2">What needs to happen?</h3>
                  <p className="text-sm text-purple-700">
                    Your investors need EIS3/SEIS3 certificates to claim their tax relief. To generate these, you'll need to submit a Compliance Statement (EIS1/SEIS1) to HMRC. We've prepared all the investor data you need.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Who will be submitting the Compliance Statement to HMRC?</Label>

                  <div className="space-y-3">
                    <button
                      onClick={() => setIsHandlingSelf(true)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                        isHandlingSelf === true
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isHandlingSelf === true ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                        }`}>
                          {isHandlingSelf === true && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-medium">I'll handle it myself</p>
                          <p className="text-sm text-gray-500">You'll submit directly to HMRC</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setIsHandlingSelf(false)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                        isHandlingSelf === false
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isHandlingSelf === false ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                        }`}>
                          {isHandlingSelf === false && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-medium">My accountant will handle it</p>
                          <p className="text-sm text-gray-500">We'll send them the data directly</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Accountant form */}
                {isHandlingSelf === false && (
                  <div className="border border-gray-200 rounded-xl p-4 space-y-4 animate-fade-in">
                    <h4 className="font-medium">Accountant Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Firm Name *</Label>
                        <Input
                          value={accountantForm.firmName}
                          onChange={(e) => setAccountantForm(prev => ({ ...prev, firmName: e.target.value }))}
                          placeholder="Smith & Co Accountants"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Name *</Label>
                        <Input
                          value={accountantForm.contactName}
                          onChange={(e) => setAccountantForm(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={accountantForm.email}
                          onChange={(e) => setAccountantForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="jane@smithco.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={accountantForm.phone}
                          onChange={(e) => setAccountantForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+44 20 1234 5678"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={accountantForm.hasBeenBriefed}
                          onChange={(e) => setAccountantForm(prev => ({ ...prev, hasBeenBriefed: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">I have briefed my accountant about this</span>
                      </label>
                    </div>
                  </div>
                )}

                <Button
                  onClick={completeOnboarding}
                  disabled={processing || isHandlingSelf === null || (isHandlingSelf === false && (!accountantForm.firmName || !accountantForm.contactName || !accountantForm.email))}
                  className="w-full"
                >
                  {processing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Review & Submission */}
        {(currentStep === 'data' || currentStep === 'submission') && (
          <div className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle>Everything you need to submit</CardTitle>
                <CardDescription>
                  Download the investor data and use it to complete your {deal.schemeType}1 Compliance Statement on HMRC.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Investor Schedule */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Investor Schedule</h4>
                      <p className="text-sm text-gray-500">{deal.investors.length} investors · {formatCurrency(deal.investmentAmount)} total</p>
                    </div>
                    <Button onClick={downloadInvestorSchedule}>
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium">Amount</th>
                          <th className="pb-2 font-medium">Shares</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deal.investors.map(inv => (
                          <tr key={inv.id} className="border-b border-gray-100">
                            <td className="py-2">{inv.name}</td>
                            <td className="py-2">{formatCurrency(inv.amountSubscribed)}</td>
                            <td className="py-2">{inv.sharesIssued.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <h4 className="font-medium mb-3">You'll also need:</h4>
                  <div className="space-y-2">
                    {[
                      'Company UTR (10-digit tax reference)',
                      'Your Companies House SH01 filing',
                      deal.schemeType === 'SEIS'
                        ? 'Confirmation 70% of funds have been spent'
                        : 'Confirmation trade has been active for 4 months'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Circle className="h-4 w-4 text-gray-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Useful links */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://find-and-update.company-information.service.gov.uk/company/${deal.companyNumber}/filing-history`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                  >
                    <Building2 className="h-4 w-4" />
                    Companies House Filing History
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://www.gov.uk/guidance/venture-capital-schemes-apply-to-use-the-seed-enterprise-investment-scheme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                  >
                    <FileText className="h-4 w-4" />
                    HMRC Guidance
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Confirm submission */}
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Have you submitted?</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Date submitted to HMRC</Label>
                      <Input
                        type="date"
                        value={submissionDate}
                        onChange={(e) => setSubmissionDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <Button
                      onClick={confirmSubmission}
                      disabled={processing || !submissionDate}
                      className="w-full"
                    >
                      {processing ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirming...</>
                      ) : (
                        <>Confirm Submission <CheckCircle className="h-4 w-4 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waiting for EIS2 */}
        {currentStep === 'eis2' && (
          <div className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle>Waiting for HMRC</CardTitle>
                <CardDescription>
                  Great work! Your submission is with HMRC. They typically respond within 4-8 weeks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <p className="text-sm text-blue-700">
                    HMRC will review your submission and issue an EIS2/SEIS2 approval letter. Once you receive it, upload it here so we can generate the certificates for your investors.
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">Upload EIS2/SEIS2 Document</h4>
                  <p className="text-sm text-gray-500 mb-4">PDF format preferred</p>
                  <label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={uploadEIS2}
                      className="hidden"
                    />
                    <Button asChild disabled={uploadingEIS2}>
                      <span>
                        {uploadingEIS2 ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                          <>Select File</>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Complete */}
        {currentStep === 'complete' && (
          <div className="space-y-6 animate-slide-up">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">All Done!</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  We've received your EIS2 document and are generating the certificates. Your investors will receive their EIS3/SEIS3 certificates shortly.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact info */}
        {deal.accountant && currentStep !== 'onboarding' && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Your accountant is also handling this:</p>
                  <p className="font-medium">{deal.accountant.contactName} at {deal.accountant.firmName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-500 text-center">
            Questions? Contact the Ascension team for support.
          </p>
        </div>
      </footer>
    </div>
  )
}
