import { gql } from '@apollo/client'

export const GET_USER_BONDS = gql`
  query GetUserBonds($subName: String, $userId: Int, $filterByStatus: BondStatus, $cursor: String) {
    userBonds(subName: $subName, userId: $userId, filterByStatus: $filterByStatus, cursor: $cursor) {
      cursor
      bonds {
        id
        userId
        subName
        bondCostSats
        bondDurationDays
        bondStatus
        lastActionTime
        reclaimableInSeconds
        createdAt
        updatedAt
        forfeitedAt
      }
    }
  }
`
export const RECLAIM_USER_BOND = gql`
  mutation ReclaimUserBond ($subName: String!, $userId: Int) {
    reclaimBond(subName: $subName, userId: $userId) {
      id
      userId
      subName
      bondCostSats
      bondDurationDays
      bondStatus
      lastActionTime
      reclaimableInSeconds
      createdAt
      updatedAt
      forfeitedAt
    }
  }
`
