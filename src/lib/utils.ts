import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function daysSince(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AWAITING_ONBOARDING: 'bg-yellow-100 text-yellow-800',
    ONBOARDING_COMPLETE: 'bg-blue-100 text-blue-800',
    AWAITING_SUBMISSION: 'bg-blue-100 text-blue-800',
    SUBMITTED: 'bg-green-100 text-green-800',
    AWAITING_EIS2: 'bg-green-100 text-green-800',
    EIS2_RECEIVED: 'bg-green-100 text-green-800',
    COMPLETE: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AWAITING_ONBOARDING: 'Awaiting Onboarding',
    ONBOARDING_COMPLETE: 'Onboarding Complete',
    AWAITING_SUBMISSION: 'Awaiting Submission',
    SUBMITTED: 'Submitted',
    AWAITING_EIS2: 'Awaiting EIS2',
    EIS2_RECEIVED: 'EIS2 Received',
    COMPLETE: 'Complete',
  }
  return labels[status] || status
}
