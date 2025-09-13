"use client";

import useClaimRewards from "@/hooks/useClaimRewards";
import useEmergencyWithdraw from "@/hooks/useEmergencyWithdraw";
import { useStake } from "@/hooks/useStake";
import { useApprove } from "@/hooks/useApprove";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { BigNumber } from "ethers";


// NEW: Apollo imports
import {
  useUserStakes,
  useContractStats,
  useUserPositionsDetailed,
} from "@/hooks/useStakingData";

import React from "react";

const STAKING_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS; // Replace with your contract address

export default function Dashboard(): React.JSX.Element {
  const { address } = useAccount();
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isEmergencyWithdrawing, setIsEmergencyWithdrawing] =
    useState<boolean>(false);

  // EXISTING: Keep all your write functions
  const claimRewards = useClaimRewards();
  const emergencyWithdraw = useEmergencyWithdraw();
  const stakeTokens = useStake();
  const approveTokens = useApprove();

  // NEW: Apollo data fetching (read-only)
  const {
    user: apolloUser,
    stakePositions,
    loading: apolloUserLoading,
  } = useUserStakes(address || "");

  const { contract, loading: contractLoading } = useContractStats(
    process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS || ""
  );

  const {
    user: detailedUser,
    positions,
    loading: positionsLoading,
  } = useUserPositionsDetailed(address || "");

  // EXISTING: Keep your write function handlers
  const handleApprove = async (): Promise<void> => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert("What do you think you're approving");
      return;
    }
    setIsApproving(true);
    try {
      await approveTokens(parseFloat(stakeAmount));
    } catch (error) {
      console.error("Approving failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleStake = async (): Promise<void> => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsStaking(true);
    try {
      await stakeTokens(parseFloat(stakeAmount));
      setStakeAmount("");
    } catch (error) {
      console.error("Staking failed:", error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleClaim = async (): Promise<void> => {
    setIsClaiming(true);
    try {
      await claimRewards();
    } catch (error) {
      console.error("Claim failed:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleEmergencyWithdraw = async (): Promise<void> => {
    setIsEmergencyWithdrawing(true);
    try {
      await emergencyWithdraw();
    } catch (error) {
      console.error("Emergency withdraw failed:", error);
    } finally {
      setIsEmergencyWithdrawing(false);
    }
  };

  // ENHANCED: Format helper functions with Apollo data support
  const formatTokenAmount = (amount: bigint | string | null): string => {
    if (!amount) return "0";

    if (typeof amount === "string") {
      // Apollo GraphQL returns string, convert to display format
      try {
        return parseFloat(formatEther(BigInt(amount))).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          }
        );
      } catch {
        return "0";
      }
    }

    // Handle bigint from contract calls
    return parseFloat(formatEther(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatTimeUntilUnlock = (unlockTimestamp: string | null): string => {
    if (!unlockTimestamp) return "No active stakes";

    const now = Math.floor(Date.now() / 1000);
    const unlock = parseInt(unlockTimestamp);
    const seconds = unlock - now;

    if (seconds <= 0) return "Unlocked";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatAPR = (rate: string | null): string => {
    if (!rate) return "Loading...";
    return `${(parseFloat(rate) / 100).toFixed(2)}%`;
  };

  // NEW: Calculate total pending rewards from positions
 const calculateTotalPendingRewards = (): string => {
   if (!positions || positions.length === 0) return "0";

   const total = positions.reduce(
     (sum: number, position: { pendingRewards: string }) => {
       const pending = position.pendingRewards || "0";
       try {
         // formatEther can handle string directly - no BigInt needed!
         const etherValue = parseFloat(pending);
         return sum + etherValue;
       } catch (error) {
         console.warn(`Error parsing pending rewards: ${pending}`, error);
         return sum;
       }
     },
     0
   );

   return total.toString();
 };

  // NEW: Get next unlock time from active positions
  const getNextUnlockTime = (): string | null => {
    if (!positions || positions.length === 0) return null;

    const now = Math.floor(Date.now() / 1000);
    const futureLocks = positions
      .map((p: { unlockTimestamp: string }) => parseInt(p.unlockTimestamp))
      .filter((unlock: number) => unlock > now)
      .sort((a: number, b: number) => a - b);

    return futureLocks.length > 0 ? futureLocks[0].toString() : null;
  };

  // Loading state
  const isLoading = apolloUserLoading || contractLoading || positionsLoading;

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  // NEW: Enhanced data with Apollo + fallbacks with proper typing
  const hasStake: boolean = apolloUser?.totalStaked
    ? parseFloat(apolloUser.totalStaked) > 0
    : false;
  const totalPendingRewards: string = calculateTotalPendingRewards();
  const hasPendingRewards: boolean = parseFloat(totalPendingRewards) > 0;
  const nextUnlockTime: string | null = getNextUnlockTime();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staking Dashboard</h1>
        <Link
          href="/positions"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          View Positions
        </Link>
      </div>

      {/* ENHANCED: Protocol stats with Apollo data */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Current APR</p>
          <p className="text-xl font-semibold">
            {contract ? formatAPR(contract.currentRewardRate) : "Loading..."}
          </p>
        </div>
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Total Staked (Protocol)</p>
          <p className="text-xl font-semibold">
            {contract
              ? `${formatTokenAmount(contract.totalStaked)} TOKENS`
              : "Loading..."}
          </p>
        </div>
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-xl font-semibold">
            {contract ? contract.totalUsers : "Loading..."}
          </p>
        </div>
      </div>

      {/* NEW: Additional protocol metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-3 border border-gray-200 rounded bg-blue-50">
          <p className="text-sm text-gray-600">Your Active Positions</p>
          <p className="text-lg font-semibold">{positions?.length || 0}</p>
        </div>
        <div className="p-3 border border-gray-200 rounded bg-green-50">
          <p className="text-sm text-gray-600">Total Rewards Claimed</p>
          <p className="text-lg font-semibold">
            {apolloUser
              ? `${formatTokenAmount(apolloUser.totalRewardsClaimed)}`
              : "0"}
          </p>
        </div>
        <div className="p-3 border border-gray-200 rounded bg-purple-50">
          <p className="text-sm text-gray-600">Protocol Status</p>
          <p
            className={`text-lg font-semibold ${
              contract?.isPaused ? "text-red-600" : "text-green-600"
            }`}
          >
            {contract
              ? contract.isPaused
                ? "Paused"
                : "Active"
              : "Loading..."}
          </p>
        </div>
        <div className="p-3 border border-gray-200 rounded bg-yellow-50">
          <p className="text-sm text-gray-600">Total Positions</p>
          <p className="text-lg font-semibold">
            {contract ? contract.totalStakePositions : "Loading..."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* EXISTING: Keep your stake interface exactly as is */}
        <div className="p-6 border border-gray-300 rounded">
          <h2 className="text-lg font-semibold mb-4">Stake Tokens</h2>
          <div className="space-y-4">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStakeAmount(e.target.value)
              }
              placeholder="Enter amount"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isStaking || isApproving || !address}
            />

            <button
              onClick={handleApprove}
              disabled={!address || isApproving || isStaking || !stakeAmount}
              className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isApproving ? "Approving..." : "Approve"}
            </button>

            <button
              onClick={handleStake}
              disabled={!address || isStaking || isApproving || !stakeAmount}
              className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isStaking ? "Staking..." : "Stake"}
            </button>
          </div>
        </div>

        {/* ENHANCED: Position info with Apollo data */}
        <div className="p-6 border border-gray-300 rounded">
          <h2 className="text-lg font-semibold mb-4">Your Position</h2>
          <div className="space-y-3">
            <p>
              Total Staked:{" "}
              <span className="font-semibold">
                {hasStake && apolloUser
                  ? `${formatTokenAmount(apolloUser.totalStaked)} TOKENS`
                  : "No active stakes"}
              </span>
            </p>
            <p>
              Pending Rewards:{" "}
              <span className="font-semibold text-green-600">
                {totalPendingRewards} TOKENS
              </span>
            </p>
            <p>
              Next Unlock:{" "}
              <span className="font-semibold">
                {formatTimeUntilUnlock(nextUnlockTime)}
              </span>
            </p>

            {/* NEW: Show individual position details */}
            {/* {positions && positions.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium mb-2">Position Details:</p>
                {positions.slice(0, 3).map((position, index: number) => (
                  <div key={position.id} className="text-xs text-gray-600 mb-1">
                    Position {index + 1}: {formatTokenAmount(position.amount)}{" "}
                    TOKENS - {formatTimeUntilUnlock(position.unlockTimestamp)}
                  </div>
                ))}
                {positions.length > 3 && (
                  <p className="text-xs text-gray-500">
                    ... and {positions.length - 3} more
                  </p>
                )}
              </div>
            )} */}

            {/* EXISTING: Keep your action buttons exactly as they are */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleClaim}
                disabled={!address || isClaiming || !hasPendingRewards}
                className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isClaiming ? "Claiming..." : "Claim Rewards"}
              </button>
              <button
                onClick={handleEmergencyWithdraw}
                disabled={!address || isEmergencyWithdrawing || !hasStake}
                className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isEmergencyWithdrawing
                  ? "Processing..."
                  : "Emergency Withdraw (50% penalty)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
