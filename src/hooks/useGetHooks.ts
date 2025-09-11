import {
  useReadContracts,
  useAccount,
  useWatchContractEvent,
  usePublicClient,
} from "wagmi";
import { contractAbi } from "../config/abi";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";

export const useGetHooks = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as
    | `0x${string}`
    | undefined;

  // State to trigger re-fetches when events occur
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!address) {
    toast.error("Not Connected", {
      description: "Ode!, connect wallet",
    });
    return;
  }

  if (!contractAddress || !contractAddress.startsWith("0x")) {
    toast.error("Contract address not set or invalid", {
      description:
        "NEXT_STAKING_CONTRACT_ADDRESS is undefined or not a valid address",
    });
    throw new Error(
      "NEXT_STAKING_CONTRACT_ADDRESS is undefined or not a valid address"
    );
  }

  // Function to trigger refresh
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Watch for Staked events (affects user position and total staked)
  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "Staked",
    onLogs: (logs) => {
      // Check if any event involves current user
      const userInvolved = logs.some(
        (log) => (log as any).args?.user?.toLowerCase() === address?.toLowerCase()
      );
      if (userInvolved || logs.length > 0) {
        // Refresh if user involved OR for protocol stats
        triggerRefresh();
      }
    },
  });

  // Watch for Withdrawn events
  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "Withdrawn",
    onLogs: (logs) => {
      const userInvolved = logs.some(
        (log) => (log as any).args?.user?.toLowerCase() === address?.toLowerCase()
      );
      if (userInvolved || logs.length > 0) {
        triggerRefresh();
      }
    },
  });

  // Watch for RewardsClaimed events
  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "RewardsClaimed",
    onLogs: (logs) => {
      const userInvolved = logs.some(
        (log) => (log as any).args?.user?.toLowerCase() === address?.toLowerCase()
      );
      if (userInvolved) {
        // Only refresh if current user claimed
        triggerRefresh();
      }
    },
  });

  // Watch for EmergencyWithdrawn events
  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "EmergencyWithdrawn",
    onLogs: (logs) => {
      const userInvolved = logs.some(
        (log) => (log as any).args?.user?.toLowerCase() === address?.toLowerCase()
      );
      if (userInvolved || logs.length > 0) {
        triggerRefresh();
      }
    },
  });

  // Watch for RewardRateUpdated events (affects APR display)
  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "RewardRateUpdated",
    onLogs: () => {
      triggerRefresh(); // Always refresh for APR changes
    },
  });

  // Watch for pause/unpause events
  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "StakingPaused",
    onLogs: () => {
      triggerRefresh();
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "StakingUnpaused",
    onLogs: () => {
      triggerRefresh();
    },
  });

  // Main data fetching - only refetches when events trigger
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      // User-specific data
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "userInfo",
        args: [address],
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "getPendingRewards",
        args: [address],
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "getTimeUntilUnlock",
        args: [address],
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "getUserDetails",
        args: [address],
      },
      // Contract-wide statistics
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "totalStaked",
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "currentRewardRate",
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "initialApr",
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "minLockDuration",
      },
    ],
    query: {
      enabled: !!address && !!contractAddress,
      // Remove refetchInterval - only refetch on events + manual triggers
      refetchInterval: false,
      staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    },
    // Removed queryKey as it's not a supported property for useReadContracts
  });

  // Optional: Add a manual refresh for pending rewards (since they grow over time)
  useEffect(() => {
    // Only refresh pending rewards every 60 seconds, not everything
    const interval = setInterval(() => {
      // You could create a separate hook just for pending rewards if needed
      triggerRefresh();
    }, 60000); // 1 minute for pending rewards

    return () => clearInterval(interval);
  }, [triggerRefresh]);

  if (!data) {
    return {
      userInfo: null,
      pendingRewards: null,
      timeUntilUnlock: null,
      userDetails: null,
      totalStaked: null,
      currentRewardRate: null,
      initialApr: null,
      minLockDuration: null,
      isLoading,
      error,
    };
  }

  const [
    userInfo,
    pendingRewards,
    timeUntilUnlock,
    userDetails,
    totalStaked,
    currentRewardRate,
    initialApr,
    minLockDuration,
  ] = data.map((result) => result.result);

  return {
    userInfo,
    pendingRewards,
    timeUntilUnlock,
    userDetails,
    totalStaked,
    currentRewardRate,
    initialApr,
    minLockDuration,
    isLoading,
    error,
    // Expose manual refresh function
    refresh: triggerRefresh,
  };
};
