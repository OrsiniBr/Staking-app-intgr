"use client";

import useClaimRewards from "@/hooks/useClaimRewards";
import useEmergencyWithdraw from "@/hooks/useEmergencyWithdraw";
import { useGetHooks } from "@/hooks/useGetHooks";
import { useStake } from "@/hooks/useStake";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useApprove } from "@/hooks/useApprove";

import React from "react";

export default function Dashboard(): React.JSX.Element {
  const { address } = useAccount();
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isEmergencyWithdrawing, setIsEmergencyWithdrawing] =
    useState<boolean>(false);

  // Hooks
  const claimRewards = useClaimRewards();
  const emergencyWithdraw = useEmergencyWithdraw();
  const hooksData = useGetHooks();
  const stakeTokens = useStake();
  const approveTokens = useApprove();

  // Extract data with proper types
  const {
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
  } = hooksData;

  // Handler functions
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

  // Format helper functions
  const formatTokenAmount = (amount: bigint | null): string => {
    if (!amount) return "0";
    return parseFloat(formatEther(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatTimeUntilUnlock = (seconds: bigint | null): string => {
    if (!seconds || Number(seconds) <= 0) return "Unlocked";

    const totalSeconds = Number(seconds);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatAPR = (apr: bigint | null): string => {
    if (!apr) return "Loading...";
    return `${Number(apr) / 100}%`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  const hasStake = userInfo?.stakedAmount && Number(userInfo.stakedAmount) > 0;
  const hasPendingRewards = pendingRewards && Number(pendingRewards) > 0;

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

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Current APR</p>
          <p className="text-xl font-semibold">
            {formatAPR(currentRewardRate)}
          </p>
        </div>
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Total Staked</p>
          <p className="text-xl font-semibold">
            {formatTokenAmount(totalStaked)} TOKENS
          </p>
        </div>
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Initial APR</p>
          <p className="text-xl font-semibold">{formatAPR(initialApr)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
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

        <div className="p-6 border border-gray-300 rounded">
          <h2 className="text-lg font-semibold mb-4">Your Position</h2>
          <div className="space-y-3">
            <p>
              Staked:{" "}
              <span className="font-semibold">
                {hasStake
                  ? `${formatTokenAmount(userInfo.stakedAmount)} TOKENS`
                  : "No active stakes"}
              </span>
            </p>
            <p>
              Pending Rewards:{" "}
              <span className="font-semibold text-green-600">
                {formatTokenAmount(pendingRewards)} TOKENS
              </span>
            </p>
            <p>
              Unlock in:{" "}
              <span className="font-semibold">
                {formatTimeUntilUnlock(timeUntilUnlock)}
              </span>
            </p>
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
