export interface User {
  id: string;
  address: string;
  totalStaked: string;
  totalWithdrawn: string;
  totalRewardsClaimed: string;
  stakeCount: string;
  firstStakeTimestamp: string;
  lastActivityTimestamp: string;
}

export interface StakePosition {
  id: string;
  user: string;
  amount: string;
  stakeTimestamp: string;
  unlockTimestamp: string;
  isActive: boolean;
  withdrawnAt?: string;
  emergencyWithdrawn: boolean;
  rewardRate: string;
  lastRewardCalculation: string;
  accumulatedRewards: string;
}

export interface StakingContract {
  id: string;
  address: string;
  stakingToken: string;
  totalStaked: string;
  currentRewardRate: string;
  totalUsers: string;
  totalStakePositions: string;
  initialApr: string;
  minLockDuration: string;
  aprReductionPerThousand: string;
  emergencyWithdrawPenalty: string;
  isPaused: boolean;
  totalRewardsPaid: string;
  totalEmergencyWithdrawals: string;
  totalEmergencyPenalties: string;
  initializationTimestamp: string;
  lastUpdateTimestamp: string;
}

export interface UserWithPositions extends User {
  stakePositions: StakePosition[];
}
