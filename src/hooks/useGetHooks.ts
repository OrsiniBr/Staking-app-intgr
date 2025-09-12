import { useState, useEffect, useRef } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { contractAbi } from "../config/abi";
import { toast } from "sonner";

// Define types for the contract data
interface UserInfo {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  rewardDebt: bigint;
  pendingRewards: bigint;
}

interface UserDetails {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  pendingRewards: bigint;
  timeUntilUnlock: bigint;
  canWithdraw: boolean;
}

interface StakingData {
  userInfo: UserInfo | null;
  pendingRewards: bigint | null;
  timeUntilUnlock: bigint | null;
  userDetails: UserDetails | null;
  totalStaked: bigint | null;
  currentRewardRate: bigint | null;
  initialApr: bigint | null;
  minLockDuration: bigint | null;
}

interface UseGetHooksReturn extends StakingData {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useGetHooks = (): UseGetHooksReturn => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = process.env
    .NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as `0x${string}`;

  // State for all the data
  const [stakingData, setStakingData] = useState<StakingData>({
    userInfo: null,
    pendingRewards: null,
    timeUntilUnlock: null,
    userDetails: null,
    totalStaked: null,
    currentRewardRate: null,
    initialApr: null,
    minLockDuration: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const unwatchRefs = useRef<(() => void)[]>([]);

  if (!address) {
    return {
      ...stakingData,
      isLoading: false,
      error: null,
      refresh: async () => {},
    };
  }

  if (!contractAddress || !contractAddress.startsWith("0x")) {
    toast.error("Contract address not set or invalid");
    return {
      ...stakingData,
      isLoading: false,
      error: "Invalid contract address",
      refresh: async () => {},
    };
  }

  // Fetch current data from contract
  const fetchCurrentData = async (): Promise<void> => {
    if (!publicClient || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      // Read all contract data with proper typing
      const [
        userInfo,
        pendingRewards,
        timeUntilUnlock,
        userDetails,
        totalStaked,
        currentRewardRate,
        initialApr,
        minLockDuration,
      ] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "userInfo",
          args: [address],
        }) as Promise<UserInfo>,
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "getPendingRewards",
          args: [address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "getTimeUntilUnlock",
          args: [address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "getUserDetails",
          args: [address],
        }) as Promise<UserDetails>,
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "totalStaked",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "currentRewardRate",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "initialApr",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "minLockDuration",
        }) as Promise<bigint>,
      ]);

      setStakingData({
        userInfo,
        pendingRewards,
        timeUntilUnlock,
        userDetails,
        totalStaked,
        currentRewardRate,
        initialApr,
        minLockDuration,
      });
    } catch (error: any) {
      console.error("Error fetching staking data:", error);
      setError(error?.message || "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Setup event watchers that directly update state
  const setupEventWatchers = (): void => {
    if (!publicClient) return;

    const watchers: (() => void)[] = [];

    // Watch Staked events - update user data and total staked
    const stakedWatcher = publicClient.watchContractEvent({
      address: contractAddress,
      abi: contractAbi,
      eventName: "Staked",
      onLogs: (logs: any[]) => {
        const userInvolved = logs.some(
          (log) => log.args?.user?.toLowerCase() === address?.toLowerCase()
        );

        if (userInvolved) {
          // Directly update relevant data from event
          setStakingData((prev) => ({
            ...prev,
            totalStaked:
              (logs[0]?.args?.newTotalStaked as bigint) || prev.totalStaked,
            currentRewardRate:
              (logs[0]?.args?.currentRewardRate as bigint) ||
              prev.currentRewardRate,
          }));
          // Refetch user-specific data
          fetchCurrentData();
        } else {
          // Just update protocol stats
          setStakingData((prev) => ({
            ...prev,
            totalStaked:
              (logs[0]?.args?.newTotalStaked as bigint) || prev.totalStaked,
            currentRewardRate:
              (logs[0]?.args?.currentRewardRate as bigint) ||
              prev.currentRewardRate,
          }));
        }
      },
    });
    watchers.push(stakedWatcher);

    // Watch Withdrawn events
    const withdrawnWatcher = publicClient.watchContractEvent({
      address: contractAddress,
      abi: contractAbi,
      eventName: "Withdrawn",
      onLogs: (logs: any[]) => {
        const userInvolved = logs.some(
          (log) => log.args?.user?.toLowerCase() === address?.toLowerCase()
        );

        if (userInvolved) {
          // Update from event data
          setStakingData((prev) => ({
            ...prev,
            totalStaked:
              (logs[0]?.args?.newTotalStaked as bigint) || prev.totalStaked,
            currentRewardRate:
              (logs[0]?.args?.currentRewardRate as bigint) ||
              prev.currentRewardRate,
          }));
          fetchCurrentData();
        }
      },
    });
    watchers.push(withdrawnWatcher);

    // Watch RewardsClaimed events
    const claimedWatcher = publicClient.watchContractEvent({
      address: contractAddress,
      abi: contractAbi,
      eventName: "RewardsClaimed",
      onLogs: (logs: any[]) => {
        const userInvolved = logs.some(
          (log) => log.args?.user?.toLowerCase() === address?.toLowerCase()
        );

        if (userInvolved) {
          // Update pending rewards from event
          setStakingData((prev) => ({
            ...prev,
            pendingRewards:
              (logs[0]?.args?.newPendingRewards as bigint) ||
              prev.pendingRewards,
          }));
        }
      },
    });
    watchers.push(claimedWatcher);

    // Watch RewardRateUpdated events
    const rateWatcher = publicClient.watchContractEvent({
      address: contractAddress,
      abi: contractAbi,
      eventName: "RewardRateUpdated",
      onLogs: (logs: any[]) => {
        // Update APR directly from event
        setStakingData((prev) => ({
          ...prev,
          currentRewardRate:
            (logs[0]?.args?.newRate as bigint) || prev.currentRewardRate,
        }));
      },
    });
    watchers.push(rateWatcher);

    unwatchRefs.current = watchers;
  };

  useEffect(() => {
    if (publicClient && address) {
      // 1. Fetch initial data
      fetchCurrentData();

      // 2. Setup real-time event watching
      setupEventWatchers();
    }

    // Cleanup
    return () => {
      unwatchRefs.current.forEach((unwatch) => {
        if (unwatch) unwatch();
      });
      unwatchRefs.current = [];
    };
  }, [publicClient, address]);

  return {
    ...stakingData,
    isLoading,
    error,
    refresh: fetchCurrentData,
  };
};
