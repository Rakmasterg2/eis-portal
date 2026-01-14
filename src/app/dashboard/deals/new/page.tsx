'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Copy, Check, Upload, Download, FileSpreadsheet, AlertCircle, FileText, X } from 'lucide-react'

interface Investor {
  name: string
  addressLine1: string
  addressLine2: string
  city: string
  postcode: string
  country: string
  sharesIssued: string
  amountSubscribed: string
  shareIssueDate: string
  shareClass: string
}

const EXPECTED_COLUMNS = [
  'name',
  'addressLine1',
  'addressLine2',
  'city',
  'postcode',
  'country',
  'sharesIssued',
  'amountSubscribed',
  'shareIssueDate',
  'shareClass'
]

const COLUMN_ALIASES: Record<string, string> = {
  'investor name': 'name',
  'full name': 'name',
  'investor': 'name',
  'address line 1': 'addressLine1',
  'address1': 'addressLine1',
  'address 1': 'addressLine1',
  'street': 'addressLine1',
  'address line 2': 'addressLine2',
  'address2': 'addressLine2',
  'address 2': 'addressLine2',
  'apt': 'addressLine2',
  'unit': 'addressLine2',
  'town': 'city',
  'postal code': 'postcode',
  'zip': 'postcode',
  'zip code': 'postcode',
  'shares': 'sharesIssued',
  'number of shares': 'sharesIssued',
  'shares issued': 'sharesIssued',
  'amount': 'amountSubscribed',
  'amount subscribed': 'amountSubscribed',
  'subscription': 'amountSubscribed',
  'investment': 'amountSubscribed',
  'share issue date': 'shareIssueDate',
  'issue date': 'shareIssueDate',
  'date': 'shareIssueDate',
  'share class': 'shareClass',
  'class': 'shareClass'
}

function normalizeColumnName(col: string): string {
  const lower = col.toLowerCase().trim()
  if (EXPECTED_COLUMNS.includes(lower)) return lower
  return COLUMN_ALIASES[lower] || lower
}

function parseDate(value: unknown): string {
  if (!value) return ''

  // If it's already a string in YYYY-MM-DD format
  if (typeof value === 'string') {
    // Try to parse various date formats
    const dateStr = value.trim()

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const ukMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    if (ukMatch) {
      const [, day, month, year] = ukMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // Try Date constructor
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  }

  // Excel serial date number
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }

  return ''
}

export default function NewDealPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLink, setMagicLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadMode, setUploadMode] = useState<'upload' | 'manual'>('upload')

  const [formData, setFormData] = useState({
    companyName: '',
    companyNumber: '',
    schemeType: 'SEIS',
    investmentDate: '',
    investmentAmount: '',
    founderName: '',
    founderEmail: ''
  })

  const [investors, setInvestors] = useState<Investor[]>([])
  const [documents, setDocuments] = useState<{ type: string; file: File }[]>([])
  const docInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInvestorChange = (index: number, field: string, value: string) => {
    setInvestors(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addInvestor = () => {
    setInvestors(prev => [...prev, {
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      country: 'United Kingdom',
      sharesIssued: '',
      amountSubscribed: '',
      shareIssueDate: formData.investmentDate,
      shareClass: 'Ordinary'
    }])
  }

  const removeInvestor = (index: number) => {
    setInvestors(prev => prev.filter((_, i) => i !== index))
  }

  const clearInvestors = () => {
    setInvestors([])
    setUploadError('')
  }

  const [selectedDocType, setSelectedDocType] = useState('SH01')

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDocuments(prev => [...prev, { type: selectedDocType, file }])

    if (docInputRef.current) {
      docInputRef.current.value = ''
    }
  }

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const downloadTemplate = () => {
    const headers = [
      'Investor Name',
      'Address Line 1',
      'Address Line 2',
      'City',
      'Postcode',
      'Country',
      'Shares Issued',
      'Amount Subscribed',
      'Share Issue Date',
      'Share Class'
    ]
    const exampleRow = [
      'John Smith',
      '123 Main Street',
      'Flat 2B',
      'London',
      'SW1A 1AA',
      'United Kingdom',
      '1000',
      '50000',
      '2025-01-15',
      'Ordinary'
    ]

    const csv = [headers.join(','), exampleRow.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'investor_schedule_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const processUploadedData = (data: Record<string, unknown>[]) => {
    setUploadError('')

    if (data.length === 0) {
      setUploadError('No data found in file')
      return
    }

    const parsedInvestors: Investor[] = []
    const errors: string[] = []

    data.forEach((row, index) => {
      // Normalize column names
      const normalizedRow: Record<string, string> = {}
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = normalizeColumnName(key)
        normalizedRow[normalizedKey] = String(value ?? '').trim()
      })

      // Skip empty rows
      if (!normalizedRow.name && !normalizedRow.amountSubscribed) {
        return
      }

      // Validate required fields
      if (!normalizedRow.name) {
        errors.push(`Row ${index + 2}: Missing investor name`)
        return
      }
      if (!normalizedRow.amountSubscribed) {
        errors.push(`Row ${index + 2}: Missing amount subscribed`)
        return
      }

      parsedInvestors.push({
        name: normalizedRow.name || '',
        addressLine1: normalizedRow.addressline1 || normalizedRow.addressLine1 || '',
        addressLine2: normalizedRow.addressline2 || normalizedRow.addressLine2 || '',
        city: normalizedRow.city || '',
        postcode: normalizedRow.postcode || '',
        country: normalizedRow.country || 'United Kingdom',
        sharesIssued: normalizedRow.sharesissued || normalizedRow.sharesIssued || '',
        amountSubscribed: normalizedRow.amountsubscribed || normalizedRow.amountSubscribed || '',
        shareIssueDate: parseDate(row.shareIssueDate || row.shareissuedate || row['Share Issue Date'] || row['share issue date'] || row.date || row.Date) || formData.investmentDate,
        shareClass: normalizedRow.shareclass || normalizedRow.shareClass || 'Ordinary'
      })
    })

    if (errors.length > 0 && parsedInvestors.length === 0) {
      setUploadError(errors.join('\n'))
      return
    }

    if (errors.length > 0) {
      setUploadError(`Imported ${parsedInvestors.length} investors. Some rows had issues:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}`)
    }

    setInvestors(parsedInvestors)

    // Calculate total investment amount from investors
    const total = parsedInvestors.reduce((sum, inv) => sum + (parseFloat(inv.amountSubscribed) || 0), 0)
    if (total > 0 && !formData.investmentAmount) {
      setFormData(prev => ({ ...prev, investmentAmount: total.toString() }))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    const fileName = file.name.toLowerCase()

    try {
      if (fileName.endsWith('.csv')) {
        // Parse CSV
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            processUploadedData(results.data as Record<string, unknown>[])
          },
          error: (err) => {
            setUploadError(`Failed to parse CSV: ${err.message}`)
          }
        })
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)
        processUploadedData(data as Record<string, unknown>[])
      } else {
        setUploadError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      }
    } catch (err) {
      setUploadError(`Failed to read file: ${(err as Error).message}`)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Filter out empty investors
      const validInvestors = investors.filter(inv => inv.name && inv.amountSubscribed)

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          investors: validInvestors.length > 0 ? validInvestors : undefined
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create deal')
      }

      const data = await res.json()
      setMagicLink(`${window.location.origin}${data.magicLink}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(magicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Success state - show magic link
  if (magicLink) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Deal Created Successfully</CardTitle>
            <CardDescription>
              Share this magic link with the founder to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-xs text-gray-500 mb-2 block">Founder Magic Link</Label>
              <div className="flex gap-2">
                <Input
                  value={magicLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyLink} variant="outline">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This link is valid for 7 days and will allow the founder to access their deal portal.
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-4">
              <Link href="/dashboard/deals">
                <Button variant="outline">View All Deals</Button>
              </Link>
              <Button onClick={() => {
                setMagicLink('')
                setFormData({
                  companyName: '',
                  companyNumber: '',
                  schemeType: 'SEIS',
                  investmentDate: '',
                  investmentAmount: '',
                  founderName: '',
                  founderEmail: ''
                })
                setInvestors([])
              }}>
                Create Another Deal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/deals" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Deals
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Deal</h1>
        <p className="text-gray-500 mt-1">Enter the investment details to set up EIS/SEIS tracking</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Acme Ltd"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyNumber">Companies House Number *</Label>
                <Input
                  id="companyNumber"
                  value={formData.companyNumber}
                  onChange={(e) => handleChange('companyNumber', e.target.value)}
                  placeholder="12345678"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schemeType">Scheme Type *</Label>
                <Select
                  value={formData.schemeType}
                  onValueChange={(value) => handleChange('schemeType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEIS">SEIS</SelectItem>
                    <SelectItem value="EIS">EIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentDate">Investment Date *</Label>
                <Input
                  id="investmentDate"
                  type="date"
                  value={formData.investmentDate}
                  onChange={(e) => handleChange('investmentDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentAmount">Total Amount *</Label>
                <Input
                  id="investmentAmount"
                  type="number"
                  value={formData.investmentAmount}
                  onChange={(e) => handleChange('investmentAmount', e.target.value)}
                  placeholder="100000"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Founder Details */}
        <Card>
          <CardHeader>
            <CardTitle>Founder Details</CardTitle>
            <CardDescription>Primary contact for this deal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="founderName">Founder Name *</Label>
                <Input
                  id="founderName"
                  value={formData.founderName}
                  onChange={(e) => handleChange('founderName', e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="founderEmail">Founder Email *</Label>
                <Input
                  id="founderEmail"
                  type="email"
                  value={formData.founderEmail}
                  onChange={(e) => handleChange('founderEmail', e.target.value)}
                  placeholder="john@acme.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Documents</CardTitle>
            <CardDescription>Upload supporting documents (SH01, Investment Agreement, etc.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SH01">SH01</SelectItem>
                  <SelectItem value="INVESTMENT_AGREEMENT">Investment Agreement</SelectItem>
                  <SelectItem value="ARTICLES">Articles of Association</SelectItem>
                  <SelectItem value="BOARD_RESOLUTION">Board Resolution</SelectItem>
                  <SelectItem value="SHAREHOLDER_AGREEMENT">Shareholder Agreement</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleDocUpload}
                className="hidden"
                id="doc-upload"
              />
              <label htmlFor="doc-upload">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </span>
                </Button>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.file.name}</p>
                        <p className="text-xs text-gray-500">{doc.type.replace('_', ' ')} • {(doc.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {documents.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No documents uploaded yet. These can also be uploaded later.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Investors */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Investors</CardTitle>
                <CardDescription>Upload a CSV/Excel file or enter manually</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={uploadMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('upload')}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === 'manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('manual')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Manual
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadMode === 'upload' && (
              <div className="space-y-4">
                {/* Upload area */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-purple-300 transition-colors">
                  <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop your CSV or Excel file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Supports .csv, .xlsx, .xls
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="investor-upload"
                  />
                  <div className="flex gap-2 justify-center">
                    <label htmlFor="investor-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </span>
                      </Button>
                    </label>
                    <Button type="button" variant="ghost" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>

                {uploadError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <pre className="text-sm text-yellow-700 whitespace-pre-wrap">{uploadError}</pre>
                  </div>
                )}
              </div>
            )}

            {uploadMode === 'manual' && investors.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">No investors added yet</p>
                <Button type="button" variant="outline" onClick={addInvestor}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Investor
                </Button>
              </div>
            )}

            {/* Investor list */}
            {investors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {investors.length} investor{investors.length !== 1 ? 's' : ''} added
                  </p>
                  <div className="flex gap-2">
                    {uploadMode === 'manual' && (
                      <Button type="button" variant="outline" size="sm" onClick={addInvestor}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add More
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={clearInvestors} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Compact investor list for uploaded data */}
                {uploadMode === 'upload' && (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Amount</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Shares</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">City</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {investors.map((investor, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{investor.name}</td>
                            <td className="px-4 py-2">£{parseFloat(investor.amountSubscribed).toLocaleString()}</td>
                            <td className="px-4 py-2">{investor.sharesIssued || '-'}</td>
                            <td className="px-4 py-2">{investor.city || '-'}</td>
                            <td className="px-2 py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInvestor(index)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Full form for manual entry */}
                {uploadMode === 'manual' && investors.map((investor, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Investor {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInvestor(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={investor.name}
                          onChange={(e) => handleInvestorChange(index, 'name', e.target.value)}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount Subscribed *</Label>
                        <Input
                          type="number"
                          value={investor.amountSubscribed}
                          onChange={(e) => handleInvestorChange(index, 'amountSubscribed', e.target.value)}
                          placeholder="25000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Address Line 1</Label>
                        <Input
                          value={investor.addressLine1}
                          onChange={(e) => handleInvestorChange(index, 'addressLine1', e.target.value)}
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address Line 2</Label>
                        <Input
                          value={investor.addressLine2}
                          onChange={(e) => handleInvestorChange(index, 'addressLine2', e.target.value)}
                          placeholder="Apt 4B"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={investor.city}
                          onChange={(e) => handleInvestorChange(index, 'city', e.target.value)}
                          placeholder="London"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Postcode</Label>
                        <Input
                          value={investor.postcode}
                          onChange={(e) => handleInvestorChange(index, 'postcode', e.target.value)}
                          placeholder="SW1A 1AA"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={investor.country}
                          onChange={(e) => handleInvestorChange(index, 'country', e.target.value)}
                          placeholder="United Kingdom"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Shares Issued</Label>
                        <Input
                          type="number"
                          value={investor.sharesIssued}
                          onChange={(e) => handleInvestorChange(index, 'sharesIssued', e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Share Issue Date</Label>
                        <Input
                          type="date"
                          value={investor.shareIssueDate || formData.investmentDate}
                          onChange={(e) => handleInvestorChange(index, 'shareIssueDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Share Class</Label>
                        <Input
                          value={investor.shareClass}
                          onChange={(e) => handleInvestorChange(index, 'shareClass', e.target.value)}
                          placeholder="Ordinary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/deals">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </div>
  )
}
