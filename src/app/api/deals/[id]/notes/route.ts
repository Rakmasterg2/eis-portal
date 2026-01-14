import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOpsRole } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOpsRole()
    const { id } = await params
    const { content } = await request.json()

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        dealId: id,
        content: content.trim(),
        createdById: user.id
      },
      include: {
        createdBy: { select: { name: true } }
      }
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
