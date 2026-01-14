import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

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
    const uploadedBy = founder ? 'founder' : 'accountant'

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', deal.id)
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name}`
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Create document record
    const document = await prisma.document.create({
      data: {
        dealId: deal.id,
        documentType: documentType as 'INVESTOR_SCHEDULE' | 'INVESTMENT_DECK' | 'EIS2' | 'EIS3',
        filename: file.name,
        storagePath: filepath,
        uploadedBy
      }
    })

    // If uploading EIS2, create milestone and update status
    if (documentType === 'EIS2') {
      await prisma.milestone.create({
        data: {
          dealId: deal.id,
          milestoneType: 'EIS2_UPLOADED',
          confirmedBy: uploadedBy
        }
      })

      await prisma.deal.update({
        where: { id: deal.id },
        data: { status: 'EIS2_RECEIVED' }
      })
    }

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
