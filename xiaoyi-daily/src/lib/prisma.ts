import { PrismaClient } from '@prisma/client'

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof createPrismaClient>
}

const prisma = globalThis.prisma ?? createPrismaClient()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
