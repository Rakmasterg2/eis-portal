import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMagicToken } from '@/lib/auth'
import { addDays } from 'date-fns'

// POST add accountant to deal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { firmName, contactName, email, phone, hasBeenBriefed, hasInvestorData } = await request.json()

    // Find founder with this token
    const founder = await prisma.founder.findUnique({
      where: { magicToken: token },
      include: { deal: true }
    })

    if (!founder) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    // Generate magic token for accountant
    const accountantToken = generateMagicToken()
    const tokenExpiry = addDays(new Date(), 7)

    // Create accountant and update founder
    const accountant = await prisma.accountant.create({
      data: {
        dealId: founder.deal.id,
        firmName,
        contactName,
        email: email.toLowerCase(),
        phone: phone || null,
        magicToken: accountantToken,
        tokenExpiresAt: tokenExpiry,
        hasBeenBriefed: hasBeenBriefed || false,
        hasInvestorData: hasInvestorData || false
      }
    })

    // Update founder to not handling submission
    await prisma.founder.update({
      where: { id: founder.id },
      data: { isHandlingSubmission: false }
    })

    return NextResponse.json({
      accountant,
      magicLink: `/portal/accountant/${accountantToken}`
    }, { status: 201 })
  } catch (error) {
    console.error('Add accountant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
