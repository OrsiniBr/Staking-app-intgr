// lib/queries.ts
import { gql } from "@apollo/client";

export const GET_USER_STAKES = gql`
  query GetUserStakes($userId: ID!) {
    user(id: $userId) {
      id
      address
      totalStaked
      totalWithdrawn
      totalRewardsClaimed
      stakeCount
      firstStakeTimestamp
      lastActivityTimestamp
      activeStakePositions {
        id
        amount
        stakeTimestamp
        unlockTimestamp
        isActive
        rewardRate
        accumulatedRewards
        lastRewardCalculation
        emergencyWithdrawn
      }
    }
  }
`;

export const GET_CONTRACT_STATS = gql`
  query GetContractStats($contractId: ID!) {
    stakingContract(id: $contractId) {
      id
      address
      totalStaked
      currentRewardRate
      totalUsers
      totalStakePositions
      totalRewardsPaid
      totalEmergencyWithdrawals
      totalEmergencyPenalties
      initialApr
      minLockDuration
      aprReductionPerThousand
      emergencyWithdrawPenalty
      isPaused
      initializationTimestamp
      lastUpdateTimestamp
    }
  }
`;

export const GET_USER_HISTORY = gql`
  query GetUserHistory($userAddress: Bytes!) {
    stakedEvents(
      where: { user: $userAddress }
      first: 10
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      amount
      timestamp
      newTotalStaked
      currentRewardRate
      blockNumber
      transactionHash
    }
    withdrawnEvents(
      where: { user: $userAddress }
      first: 10
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      amount
      timestamp
      newTotalStaked
      rewardsAccrued
      blockNumber
      transactionHash
    }
    rewardsClaimedEvents(
      where: { user: $userAddress }
      first: 10
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      amount
      timestamp
      newPendingRewards
      totalStaked
      blockNumber
      transactionHash
    }
  }
`;
