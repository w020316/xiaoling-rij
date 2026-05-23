import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始播种数据...')

  const user = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      nickname: '小林',
      theme: 'theme-kuromi',
      checkInDays: 0,
    },
  })
  console.log('✅ 用户已创建:', user.nickname)

  const couple = await prisma.couple.findFirst()
  if (!couple) {
    const newCouple = await prisma.couple.create({
      data: {
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        startDate: new Date('2025-05-12'),
        nickname1: 'TA',
        nickname2: 'TA',
      },
    })
    console.log('✅ 情侣空间已创建, 邀请码:', newCouple.inviteCode)
  }

  const quotes = [
    '心存温柔，山河浪漫。',
    '每一天都值得被温柔以待。',
    '你笑起来真好看，像春天的花一样。',
    '生活明朗，万物可爱。',
    '慢慢来，比较快。',
    '愿你的每一天都闪闪发光。',
    '今天也要好好爱自己呀。',
    '世界很大，幸福很小。',
  ]

  const today = new Date().toISOString().split('T')[0]
  const existingQuote = await prisma.dailyQuote.findFirst({
    where: { date: new Date(today) },
  })

  if (!existingQuote) {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    )
    await prisma.dailyQuote.create({
      data: {
        content: quotes[dayOfYear % quotes.length],
        date: new Date(),
      },
    })
    console.log('✅ 每日一句已生成')
  }

  const schedules = [
    { timeStart: '08:30', timeEnd: '10:10', title: '高等数学', dayOfWeek: 1 },
    { timeStart: '14:00', timeEnd: '15:40', title: '大学英语', dayOfWeek: 1 },
    { timeStart: '08:30', timeEnd: '10:10', title: '线性代数', dayOfWeek: 2 },
    { timeStart: '14:00', timeEnd: '15:40', title: '数据结构', dayOfWeek: 2 },
    { timeStart: '08:30', timeEnd: '10:10', title: '大学物理', dayOfWeek: 3 },
    { timeStart: '14:00', timeEnd: '15:40', title: '概率论', dayOfWeek: 3 },
    { timeStart: '08:30', timeEnd: '10:10', title: '操作系统', dayOfWeek: 4 },
    { timeStart: '14:00', timeEnd: '15:40', title: '计算机网络', dayOfWeek: 4 },
    { timeStart: '08:30', timeEnd: '10:10', title: '高等数学', dayOfWeek: 5 },
  ]

  const scheduleCount = await prisma.schedule.count()
  if (scheduleCount === 0) {
    await prisma.schedule.createMany({ data: schedules })
    console.log('✅ 课程表已生成')
  }

  console.log('🎉 数据库初始化完成!')
}

main()
  .catch((e) => {
    console.error('❌ 播种失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
