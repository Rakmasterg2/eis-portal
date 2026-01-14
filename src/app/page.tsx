import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, FileCheck, Users, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-purple-600">Ascension</span>
          </h1>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            EIS/SEIS Compliance Portal
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your post-investment compliance process. Get your investors their tax relief certificates faster.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">
                Access Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">1. Create Deal</h4>
              <p className="text-gray-600 text-sm">
                Ops team creates a deal with investor details after investment closes
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">2. Founder Access</h4>
              <p className="text-gray-600 text-sm">
                Founders receive a magic link to access their submission portal
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">3. Submit to HMRC</h4>
              <p className="text-gray-600 text-sm">
                Download investor data and submit the Compliance Statement
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">4. Track Progress</h4>
              <p className="text-gray-600 text-sm">
                Monitor status and receive EIS2 to generate certificates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12 text-gray-900">
            Who Uses This Portal
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-semibold text-lg mb-2 text-purple-600">Ascension Ops</h4>
              <p className="text-gray-600 text-sm mb-4">
                Create deals, track progress, and manage the compliance process for all portfolio companies.
              </p>
              <Link href="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            </div>
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-semibold text-lg mb-2 text-purple-600">Founders</h4>
              <p className="text-gray-600 text-sm mb-4">
                Access your deal via magic link. Download investor data and confirm your HMRC submission.
              </p>
              <p className="text-xs text-gray-500">Check your email for access link</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-semibold text-lg mb-2 text-purple-600">Accountants</h4>
              <p className="text-gray-600 text-sm mb-4">
                Handle submissions on behalf of founders. Access the submission pack directly.
              </p>
              <p className="text-xs text-gray-500">Link provided by founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Ascension EIS/SEIS Compliance Portal
          </p>
        </div>
      </footer>
    </div>
  )
}
