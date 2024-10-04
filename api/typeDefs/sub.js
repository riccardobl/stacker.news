import { gql } from 'graphql-tag'

export default gql`
  extend type Query {
    sub(name: String): Sub
    subLatestPost(name: String!): String
    subs: [Sub!]!
    topSubs(cursor: String, when: String, from: String, to: String, by: String, limit: Limit): Subs
    userSubs(name: String!, cursor: String, when: String, from: String, to: String, by: String, limit: Limit): Subs
    userBonds(subName: String, userId: Int, filterByStatus: BondStatus, cursor: String): SubBonds
  }

  type SubBonds {
    cursor: String
    bonds: [SubBond!]!
  }

  type Subs {
    cursor: String
    subs: [Sub!]!
  }

  extend type Mutation {
    upsertSub(oldName: String, name: String!, desc: String, baseCost: Int!,
      postTypes: [String!]!,
      billingType: String!, billingAutoRenew: Boolean!,
      moderated: Boolean!, nsfw: Boolean!,
      bondCostSats: Int, bondDurationDays: Int, requireBondToPost: Boolean!
    ): SubPaidAction!
    paySub(name: String!): SubPaidAction!
    postBond(subName:String!): SubBondPaidAction!
    forfeitBond(subBane: String!, userId: Int): SubBond!
    reclaimBond(subName: String!, userId: Int): SubBond!
    toggleMuteSub(name: String!): Boolean!
    toggleSubSubscription(name: String!): Boolean!
    transferTerritory(subName: String!, userName: String!): Sub
    unarchiveTerritory(name: String!, desc: String, baseCost: Int!,
      postTypes: [String!]!,
      billingType: String!, billingAutoRenew: Boolean!,
      moderated: Boolean!, nsfw: Boolean!): SubPaidAction!
  }

  type Sub {
    name: ID!
    createdAt: Date!
    userId: Int!
    user: User!
    desc: String
    updatedAt: Date!
    postTypes: [String!]!
    allowFreebies: Boolean!
    billingCost: Int!
    billingType: String!
    billingAutoRenew: Boolean!
    rankingType: String!
    billedLastAt: Date!
    billPaidUntil: Date
    baseCost: Int!
    status: String!
    moderated: Boolean!
    moderatedCount: Int!
    meMuteSub: Boolean!
    nsfw: Boolean!
    nposts(when: String, from: String, to: String): Int!
    ncomments(when: String, from: String, to: String): Int!
    meSubscription: Boolean!

    bondCostSats: Int
    bondDurationDays: Int
    requireBondToPost: Boolean
    meActiveBond: Boolean

    optional: SubOptional!
  }

  type SubOptional {
    """
    conditionally private
    """
    stacked(when: String, from: String, to: String): Int
    spent(when: String, from: String, to: String): Int
    revenue(when: String, from: String, to: String): Int
  }

  enum BondStatus {
    active
    forfeited
    reclaimed
  }

  type SubBond {
    id: ID!
    userId: Int!
    subName: String!
    bondCostSats: Int!
    bondDurationDays: Int!
    bondStatus: BondStatus!
    createdAt: Date!
    updatedAt: Date!
    forfeitedAt: Date
    user: User!
    sub: Sub!
    lastActionTime: Date
    reclaimableInSeconds: Int    
  }
`
