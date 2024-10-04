import { satsToMsats, msatsToSats } from '@/lib/format'
export const anonable = false
export const supportsPessimism = true
export const supportsOptimism = false

export async function getCost ({ subName }, { models }) {
  const sub = await models.sub.findUnique({
    where: {
      name: subName
    }
  })
  const costSats = sub?.requireBondToPost ? sub.bondCostSats : 0n
  if (!(costSats > 0 && isFinite(costSats))) throw new Error('Invalid cost')
  return satsToMsats(costSats)
}

export async function perform ({ subName }, { me, cost, tx }) {
  if (!cost) throw new Error('Missing cost in context')

  const sub = await tx.sub.findUnique({
    where: {
      name: subName
    }
  })
  if (!sub?.requireBondToPost) throw new Error('This territory does not require a bond to post')

  const existing = await tx.subBond.findFirst({
    where: {
      subName,
      bondStatus: 'active',
      userId: me?.id
    }
  })
  if (existing) throw new Error('There is already an active bond for this territory')

  const costSats = msatsToSats(cost)
  if (!(costSats > 0 && isFinite(costSats))) throw new Error('Invalid cost')

  const bond = await tx.subBond.create({
    data: {
      userId: me?.id,
      subName,
      bondCostSats: costSats,
      bondDurationDays: sub.bondDurationDays,
      bondStatus: 'active'
    }
  })

  return bond
}

export async function describe (args, context) {
  return 'SN: post a bond to a territory'
}
