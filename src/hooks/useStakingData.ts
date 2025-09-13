import { useQuery } from "@apollo/client";
import {
  GET_USER_STAKES,
  GET_CONTRACT_STATS,
  GET_USER_POSITIONS_DETAILED,
  GET_USER_HISTORY,
} from "../queries/staking-queries";
import { User, StakePosition, StakingContract } from "../types/staking";

export const useUserStakes = (userAddress: string) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_STAKES, {
    variables: { userAddress: userAddress.toLowerCase() },
    skip: !userAddress,
    pollInterval: 30000, // Poll every 30 seconds
  });

  return {
    user: data?.user as User,
    stakePositions: data?.stakePositions as StakePosition[],
    loading,
    error,
    refetch,
  };
};

export const useContractStats = (contractAddress: string) => {
  const { data, loading, error, refetch } = useQuery(GET_CONTRACT_STATS, {
    variables: { contractAddress: contractAddress.toLowerCase() },
    skip: !contractAddress,
    pollInterval: 60000, // Poll every minute
  });

  return {
    contract: data?.stakingContract as StakingContract,
    loading,
    error,
    refetch,
  };
};

export const useUserPositionsDetailed = (userAddress: string) => {
  const { data, loading, error, refetch } = useQuery(
    GET_USER_POSITIONS_DETAILED,
    {
      variables: { userAddress: userAddress.toLowerCase() },
      skip: !userAddress,
      pollInterval: 30000,
    }
  );

  // Calculate pending rewards for each position
  const calculatePendingRewards = (position: StakePosition) => {
    const now = Math.floor(Date.now() / 1000);
    const lastCalculation = parseInt(position.lastRewardCalculation);
    const timeElapsed = now - lastCalculation;
    const rewardRate = parseFloat(position.rewardRate) / 10000; // Assuming basis points
    const amount = parseFloat(position.amount);

    // Simple calculation: amount * rate * time / seconds_per_year
    const pendingRewards =
      (amount * rewardRate * timeElapsed) / (365 * 24 * 60 * 60);
    return pendingRewards.toString();
  };

  const positionsWithRewards = data?.stakePositions?.map(
    (position: StakePosition) => ({
      ...position,
      pendingRewards: calculatePendingRewards(position),
    })
  );

  return {
    user: data?.user as User,
    positions: positionsWithRewards,
    loading,
    error,
    refetch,
  };
};

export const useUserHistory = (userAddress: string) => {
  const { data, loading, error } = useQuery(GET_USER_HISTORY, {
    variables: { userAddress },
    skip: !userAddress,
  });

  return {
    stakedEvents: data?.stakedEvents || [],
    withdrawnEvents: data?.withdrawnEvents || [],
    rewardsClaimedEvents: data?.rewardsClaimedEvents || [],
    loading,
    error,
  };
};
