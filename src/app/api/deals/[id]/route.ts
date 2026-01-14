import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOpsRole } from '@/lib/auth'

// GET single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOpsRole()
    const { id } = await params

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        founder: true,
        accountant: true,
        investors: true,
        milestones: {
          orderBy: { confirmedAt: 'desc' }
        },
        documents: true,
        notes: {
          include: { createdBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        createdBy: { select: { name: true } }
      }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Get deal error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH update deal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOpsRole()
    const { id } = await params
    const data = await request.json()

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        founder: true,
        accountant: true,
        investors: true,
        milestones: true
      }
    })

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Update deal error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOpsRole()
    const { id } = await params

    await prisma.deal.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete deal error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
