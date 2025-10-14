// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  await prisma.user.upsert({
    where: { email: 'admin@synergyconsulting.io' },
    update: {},
    create: {
      email: 'admin@synergyconsulting.io',
      name: 'Administrator',
      password: hashedPassword,
    },
  })

  console.log('Admin user created successfully!')
  console.log('Email: admin@synergyconsulting.io')
  console.log('Password: admin123')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })