import { gql } from "@apollo/client";

// Get user's stakes and pending rewards
export const GET_USER_STAKES = gql`
  query GetUserStakes($userAddress: String!) {
    user(id: $userAddress) {
      id
      address
      totalStaked
      totalWithdrawn
      totalRewardsClaimed
      stakeCount
      firstStakeTimestamp
      lastActivityTimestamp
    }

    stakePositions(
      where: { user: $userAddress, isActive: true }
      orderBy: stakeTimestamp
      orderDirection: desc
    ) {
      id
      amount
      stakeTimestamp
      unlockTimestamp
      rewardRate
      lastRewardCalculation
      accumulatedRewards
      emergencyWithdrawn
    }
  }
`;

// Get contract-wide statistics
export const GET_CONTRACT_STATS = gql`
  query GetContractStats($contractAddress: String!) {
    stakingContract(id: $contractAddress) {
      id
      address
      stakingToken
      totalStaked
      currentRewardRate
      totalUsers
      totalStakePositions
      initialApr
      minLockDuration
      isPaused
      totalRewardsPaid
      initializationTimestamp
      lastUpdateTimestamp
    }
  }
`;

// Get all active stake positions for a user with unlock times
export const GET_USER_POSITIONS_DETAILED = gql`
  query GetUserPositionsDetailed($userAddress: String!) {
    user(id: $userAddress) {
      id
      address
      totalStaked
      totalRewardsClaimed
      stakeCount
    }

    stakePositions(
      where: { user: $userAddress, isActive: true }
      orderBy: stakeTimestamp
      orderDirection: desc
    ) {
      id
      amount
      stakeTimestamp
      unlockTimestamp
      rewardRate
      accumulatedRewards
      lastRewardCalculation
    }
  }
`;

// Get recent staking activity
export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($limit: Int = 10) {
    stakedEvents(first: $limit, orderBy: blockTimestamp, orderDirection: desc) {
      id
      user
      amount
      timestamp
      newTotalStaked
      currentRewardRate
      blockNumber
      transactionHash
    }

    withdrawnEvents(
      first: $limit
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      user
      amount
      timestamp
      newTotalStaked
      rewardsAccrued
      blockNumber
      transactionHash
    }
  }
`;

// Get user's complete history
export const GET_USER_HISTORY = gql`
  query GetUserHistory($userAddress: Bytes!) {
    stakedEvents(
      where: { user: $userAddress }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      amount
      timestamp
      currentRewardRate
      newTotalStaked
      blockNumber
      transactionHash
    }

    withdrawnEvents(
      where: { user: $userAddress }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      amount
      timestamp
      rewardsAccrued
      newTotalStaked
      blockNumber
      transactionHash
    }

    rewardsClaimedEvents(
      where: { user: $userAddress }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      amount
      timestamp
      newPendingRewards
      blockNumber
      transactionHash
    }
  }
`;