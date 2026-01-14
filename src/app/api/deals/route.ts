import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOpsRole, generateMagicToken } from '@/lib/auth'
import { addDays } from 'date-fns'

// GET all deals
export async function GET(request: NextRequest) {
  try {
    const user = await requireOpsRole()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const schemeType = searchParams.get('schemeType')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (schemeType) where.schemeType = schemeType

    const deals = await prisma.deal.findMany({
      where,
      include: {
        founder: true,
        accountant: true,
        investors: true,
        milestones: {
          orderBy: { confirmedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ deals, user })
  } catch (error) {
    console.error('Get deals error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if ((error as Error).message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new deal
export async function POST(request: NextRequest) {
  try {
    const user = await requireOpsRole()
    const data = await request.json()

    const {
      companyName,
      companyNumber,
      schemeType,
      investmentDate,
      investmentAmount,
      founderName,
      founderEmail,
      investors
    } = data

    // Validate required fields
    if (!companyName || !companyNumber || !schemeType || !investmentDate || !investmentAmount || !founderName || !founderEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate magic token for founder
    const magicToken = generateMagicToken()
    const tokenExpiry = addDays(new Date(), 7)

    // Create deal with founder
    const deal = await prisma.deal.create({
      data: {
        companyName,
        companyNumber,
        schemeType,
        investmentDate: new Date(investmentDate),
        investmentAmount: parseFloat(investmentAmount),
        createdById: user.id,
        founder: {
          create: {
            name: founderName,
            email: founderEmail.toLowerCase(),
            magicToken,
            tokenExpiresAt: tokenExpiry
          }
        },
        investors: investors && investors.length > 0 ? {
          create: investors.map((inv: {
            name: string
            addressLine1: string
            addressLine2?: string
            city: string
            postcode: string
            country?: string
            sharesIssued: number | string
            amountSubscribed: number | string
            shareIssueDate: string
            shareClass?: string
          }) => ({
            name: inv.name,
            addressLine1: inv.addressLine1,
            addressLine2: inv.addressLine2 || null,
            city: inv.city,
            postcode: inv.postcode,
            country: inv.country || 'United Kingdom',
            sharesIssued: parseInt(String(inv.sharesIssued)),
            amountSubscribed: parseFloat(String(inv.amountSubscribed)),
            shareIssueDate: new Date(inv.shareIssueDate),
            shareClass: inv.shareClass || 'Ordinary'
          }))
        } : undefined
      },
      include: {
        founder: true,
        investors: true
      }
    })

    return NextResponse.json({ deal, magicLink: `/portal/founder/${magicToken}` }, { status: 201 })
  } catch (error) {
    console.error('Create deal error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if ((error as Error).message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
