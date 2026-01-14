import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET deal by magic token (founder or accountant)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Try to find founder with this token
    let founder = await prisma.founder.findUnique({
      where: { magicToken: token },
      include: {
        deal: {
          include: {
            investors: true,
            milestones: {
              orderBy: { confirmedAt: 'desc' }
            },
            documents: true,
            accountant: true
          }
        }
      }
    })

    if (founder) {
      // Check token expiry
      if (founder.tokenExpiresAt && founder.tokenExpiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Token has expired. Please request a new link.' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        type: 'founder',
        founder: {
          id: founder.id,
          name: founder.name,
          email: founder.email,
          isHandlingSubmission: founder.isHandlingSubmission
        },
        deal: founder.deal
      })
    }

    // Try to find accountant with this token
    const accountant = await prisma.accountant.findUnique({
      where: { magicToken: token },
      include: {
        deal: {
          include: {
            founder: true,
            investors: true,
            milestones: {
              orderBy: { confirmedAt: 'desc' }
            },
            documents: true
          }
        }
      }
    })

    if (accountant) {
      // Check token expiry
      if (accountant.tokenExpiresAt && accountant.tokenExpiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Token has expired. Please request a new link.' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        type: 'accountant',
        accountant: {
          id: accountant.id,
          firmName: accountant.firmName,
          contactName: accountant.contactName,
          email: accountant.email
        },
        deal: accountant.deal
      })
    }

    return NextResponse.json(
      { error: 'Invalid or expired link' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Portal access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST update deal status/milestones
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { action, data } = await request.json()

    // Find the token owner
    const founder = await prisma.founder.findUnique({
      where: { magicToken: token },
      include: { deal: true }
    })

    const accountant = founder ? null : await prisma.accountant.findUnique({
      where: { magicToken: token },
      include: { deal: true }
    })

    const tokenOwner = founder || accountant
    if (!tokenOwner) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    const deal = tokenOwner.deal
    const confirmedBy = founder ? 'founder' : 'accountant'

    switch (action) {
      case 'complete_onboarding': {
        // Update founder handling status
        if (founder) {
          await prisma.founder.update({
            where: { id: founder.id },
            data: { isHandlingSubmission: data.isHandlingSubmission }
          })
        }

        // Create milestone
        await prisma.milestone.create({
          data: {
            dealId: deal.id,
            milestoneType: 'ONBOARDING_COMPLETE',
            confirmedBy
          }
        })

        // Update deal status
        await prisma.deal.update({
          where: { id: deal.id },
          data: { status: 'ONBOARDING_COMPLETE' }
        })

        return NextResponse.json({ success: true })
      }

      case 'confirm_submission': {
        // Create milestone
        await prisma.milestone.create({
          data: {
            dealId: deal.id,
            milestoneType: 'SUBMISSION_CONFIRMED',
            confirmedBy,
            notes: data.submissionDate
          }
        })

        // Update deal status
        await prisma.deal.update({
          where: { id: deal.id },
          data: { status: 'SUBMITTED' }
        })

        return NextResponse.json({ success: true })
      }

      case 'confirm_eis2': {
        // Create milestone
        await prisma.milestone.create({
          data: {
            dealId: deal.id,
            milestoneType: 'EIS2_RECEIVED',
            confirmedBy
          }
        })

        // Update deal status
        await prisma.deal.update({
          where: { id: deal.id },
          data: { status: 'AWAITING_EIS2' }
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Portal update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
