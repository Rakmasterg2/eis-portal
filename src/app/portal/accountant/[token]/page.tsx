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
  Building2,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Deal {
  id: string
  companyName: string
  companyNumber: string
  schemeType: string
  investmentDate: string
  investmentAmount: number
  status: string
  founder?: {
    name: string
    email: string
  }
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
}

interface Accountant {
  id: string
  firmName: string
  contactName: string
  email: string
}

type Step = 'data' | 'submission' | 'eis2' | 'complete'

export default function AccountantPortalPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deal, setDeal] = useState<Deal | null>(null)
  const [accountant, setAccountant] = useState<Accountant | null>(null)

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
        if (data.type !== 'accountant') {
          throw new Error('Invalid access link')
        }
        setDeal(data.deal)
        setAccountant(data.accountant)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchDeal()
  }, [token])

  const getCurrentStep = (): Step => {
    if (!deal) return 'data'
    switch (deal.status) {
      case 'AWAITING_ONBOARDING':
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
        return 'data'
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

  if (!deal || !accountant) return null

  const currentStep = getCurrentStep()

  const steps = [
    { key: 'data', label: 'Review Data', number: 1 },
    { key: 'submission', label: 'Submit to HMRC', number: 2 },
    { key: 'eis2', label: 'Receive EIS2', number: 3 },
    { key: 'complete', label: 'Complete', number: 4 }
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
        {/* Intro for accountant */}
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardContent className="py-4">
            <p className="text-sm text-purple-800">
              <strong>{deal.founder?.name}</strong> at {deal.companyName} has asked you to handle their {deal.schemeType} Compliance Statement submission.
            </p>
          </CardContent>
        </Card>

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
                      <div className={`w-16 md:w-24 h-0.5 mx-1 md:mx-2 ${index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Data Review & Submission */}
        {currentStep === 'data' && (
          <div className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle>Submission Pack</CardTitle>
                <CardDescription>
                  Here's everything you need to complete the {deal.schemeType}1 Compliance Statement for {deal.companyName}.
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

                {/* Company details */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{deal.companyName}</p>
                  </div>
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
                    <p className="font-medium">{formatDate(deal.investmentDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Scheme</p>
                    <p className="font-medium">{deal.schemeType}</p>
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <h4 className="font-medium mb-3">Required from the company:</h4>
                  <div className="space-y-2">
                    {[
                      'Company UTR (10-digit tax reference)',
                      'SH01 filing confirmation',
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
                    Companies House
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
                  <h4 className="font-medium mb-4">Confirm submission</h4>
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
                  The submission is with HMRC. They typically respond within 4-8 weeks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <p className="text-sm text-blue-700">
                    Once you receive the EIS2/SEIS2 approval letter from HMRC, upload it here so Ascension can generate the certificates for the investors.
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
                  Ascension has received the EIS2 document and will generate the certificates. The investors will receive their EIS3/SEIS3 certificates shortly.
                </p>
              </CardContent>
            </Card>
          </div>
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
