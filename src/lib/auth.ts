import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me'
const MAGIC_LINK_SECRET = process.env.MAGIC_LINK_SECRET || 'magic-secret-change-me'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: object, expiresIn: string | number = '24h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
  } catch {
    return null
  }
}

export function generateMagicToken(): string {
  return uuidv4() + '-' + Date.now().toString(36)
}

export function generateMagicLink(token: string, type: 'founder' | 'accountant'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/portal/${type}/${token}`
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, email: true, role: true }
  })

  return user
}

export async function requireAuth() {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireOpsRole() {
  const user = await requireAuth()
  if (user.role !== 'OPS' && user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }
  return user
}
