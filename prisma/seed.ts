import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

// Create Prisma client with Neon adapter
const connectionString = process.env.DATABASE_URL!
const client = neon(connectionString)
const adapter = new PrismaNeon(client)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ascension.vc' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ascension.vc',
      passwordHash,
      role: 'ADMIN'
    }
  })

  console.log('Created admin user:', adminUser.email)

  // Create ops user
  const opsUser = await prisma.user.upsert({
    where: { email: 'ops@ascension.vc' },
    update: {},
    create: {
      name: 'Operations Team',
      email: 'ops@ascension.vc',
      passwordHash,
      role: 'OPS'
    }
  })

  console.log('Created ops user:', opsUser.email)

  // Create sample deals
  const magicToken1 = uuidv4() + '-' + Date.now().toString(36)

  const deal1 = await prisma.deal.upsert({
    where: { id: 'deal-1' },
    update: {},
    create: {
      id: 'deal-1',
      companyName: 'TechStart Ltd',
      companyNumber: '12345678',
      schemeType: 'SEIS',
      investmentDate: new Date('2025-01-10'),
      investmentAmount: 150000,
      status: 'AWAITING_ONBOARDING',
      createdById: opsUser.id,
      founder: {
        create: {
          name: 'John Smith',
          email: 'john@techstart.io',
          magicToken: magicToken1,
          tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      investors: {
        create: [
          {
            name: 'Alice Johnson',
            addressLine1: '123 Investment Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom',
            sharesIssued: 1000,
            amountSubscribed: 50000,
            shareIssueDate: new Date('2025-01-10'),
            shareClass: 'Ordinary'
          },
          {
            name: 'Bob Williams',
            addressLine1: '456 Capital Road',
            addressLine2: 'Flat 2B',
            city: 'Manchester',
            postcode: 'M1 1AA',
            country: 'United Kingdom',
            sharesIssued: 2000,
            amountSubscribed: 100000,
            shareIssueDate: new Date('2025-01-10'),
            shareClass: 'Ordinary'
          }
        ]
      }
    }
  })

  console.log('Created deal 1:', deal1.companyName)
  console.log('  Founder magic link: /portal/founder/' + magicToken1)

  const magicToken2 = uuidv4() + '-' + Date.now().toString(36)

  const deal2 = await prisma.deal.upsert({
    where: { id: 'deal-2' },
    update: {},
    create: {
      id: 'deal-2',
      companyName: 'GreenEnergy Co',
      companyNumber: '87654321',
      schemeType: 'EIS',
      investmentDate: new Date('2025-01-05'),
      investmentAmount: 500000,
      status: 'SUBMITTED',
      createdById: opsUser.id,
      founder: {
        create: {
          name: 'Sarah Green',
          email: 'sarah@greenenergy.co',
          magicToken: magicToken2,
          tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isHandlingSubmission: false
        }
      },
      accountant: {
        create: {
          firmName: 'Smith & Co Accountants',
          contactName: 'Jane Smith',
          email: 'jane@smithco.com',
          phone: '+44 20 1234 5678',
          magicToken: uuidv4() + '-' + Date.now().toString(36),
          tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          hasBeenBriefed: true,
          hasInvestorData: true
        }
      },
      investors: {
        create: [
          {
            name: 'Charlie Brown',
            addressLine1: '789 Eco Lane',
            city: 'Bristol',
            postcode: 'BS1 1AA',
            country: 'United Kingdom',
            sharesIssued: 5000,
            amountSubscribed: 250000,
            shareIssueDate: new Date('2025-01-05'),
            shareClass: 'Ordinary'
          },
          {
            name: 'Diana Ross',
            addressLine1: '321 Green Street',
            city: 'Edinburgh',
            postcode: 'EH1 1AA',
            country: 'United Kingdom',
            sharesIssued: 5000,
            amountSubscribed: 250000,
            shareIssueDate: new Date('2025-01-05'),
            shareClass: 'Ordinary'
          }
        ]
      },
      milestones: {
        create: [
          {
            milestoneType: 'ONBOARDING_COMPLETE',
            confirmedBy: 'founder',
            confirmedAt: new Date('2025-01-07')
          },
          {
            milestoneType: 'SUBMISSION_CONFIRMED',
            confirmedBy: 'accountant',
            confirmedAt: new Date('2025-01-12'),
            notes: '2025-01-12'
          }
        ]
      }
    }
  })

  console.log('Created deal 2:', deal2.companyName)
  console.log('  Founder magic link: /portal/founder/' + magicToken2)

  const magicToken3 = uuidv4() + '-' + Date.now().toString(36)

  const deal3 = await prisma.deal.upsert({
    where: { id: 'deal-3' },
    update: {},
    create: {
      id: 'deal-3',
      companyName: 'FinTech Solutions',
      companyNumber: '11223344',
      schemeType: 'SEIS',
      investmentDate: new Date('2024-12-15'),
      investmentAmount: 100000,
      status: 'COMPLETE',
      completedAt: new Date('2025-01-10'),
      createdById: opsUser.id,
      founder: {
        create: {
          name: 'Mike Finance',
          email: 'mike@fintech.io',
          magicToken: magicToken3,
          tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      investors: {
        create: [
          {
            name: 'Edward Investor',
            addressLine1: '100 Money Street',
            city: 'London',
            postcode: 'EC1A 1BB',
            country: 'United Kingdom',
            sharesIssued: 1000,
            amountSubscribed: 100000,
            shareIssueDate: new Date('2024-12-15'),
            shareClass: 'Ordinary'
          }
        ]
      },
      milestones: {
        create: [
          {
            milestoneType: 'ONBOARDING_COMPLETE',
            confirmedBy: 'founder',
            confirmedAt: new Date('2024-12-17')
          },
          {
            milestoneType: 'SUBMISSION_CONFIRMED',
            confirmedBy: 'founder',
            confirmedAt: new Date('2024-12-20')
          },
          {
            milestoneType: 'EIS2_RECEIVED',
            confirmedBy: 'founder',
            confirmedAt: new Date('2025-01-08')
          },
          {
            milestoneType: 'EIS2_UPLOADED',
            confirmedBy: 'founder',
            confirmedAt: new Date('2025-01-08')
          }
        ]
      }
    }
  })

  console.log('Created deal 3:', deal3.companyName)

  console.log('\n=== Seed Complete ===')
  console.log('\nLogin credentials:')
  console.log('  Email: admin@ascension.vc')
  console.log('  Password: admin123')
  console.log('\n  Email: ops@ascension.vc')
  console.log('  Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
