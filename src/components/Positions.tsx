"use client";

import { useGetHooks } from "@/hooks/useGetHooks";
import useWithdraw from "@/hooks/useWithdraw";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function Positions() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const withdrawTokens = useWithdraw();
  const { address } = useAccount();
  const hooksData = useGetHooks();

  // Define the expected shape for userDetails
  type UserDetails = {
    stakedAmount?: bigint;
    // add other properties if needed
  };

  // Extract data from hooks
  const userDetails: UserDetails | undefined = hooksData?.userDetails as
    | UserDetails
    | undefined;
  const pendingRewards = hooksData?.pendingRewards;
  const timeUntilUnlock = hooksData?.timeUntilUnlock;
  const isLoading = hooksData?.isLoading;

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsWithdrawing(true);
    try {
      await withdrawTokens(parseFloat(withdrawAmount));
      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdrawal failed:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Helper functions to format data
  const formatTokenAmount = (amount: bigint | undefined) => {
    if (!amount) return "0";
    return (Number(amount) / 10 ** 18).toLocaleString();
  };

  const formatTimeUntilUnlock = (seconds: bigint | undefined) => {
    if (!seconds || Number(seconds) <= 0) return "Unlocked";

    const totalSeconds = Number(seconds);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    return `${days}d ${hours}h left`;
  };

  const isUnlocked = (timeLeft: bigint | undefined) => {
    return !timeLeft || Number(timeLeft) <= 0;
  };

  // if (isLoading) {
  //   return <div className="p-6">Loading...</div>;
  // }

  const stakedAmount = userDetails?.stakedAmount;
  const hasStake = stakedAmount && Number(stakedAmount) > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stake Positions</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Stakes</h2>
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left border-b">Amount</th>
              <th className="p-3 text-left border-b">Rewards</th>
              <th className="p-3 text-left border-b">Status</th>
              <th className="p-3 text-left border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {hasStake ? (
              <tr>
                <td className="p-3 border-b">
                  {formatTokenAmount(stakedAmount)} TOKENS
                </td>
                <td className="p-3 border-b">
                  {formatTokenAmount(pendingRewards as bigint | undefined)}{" "}
                  TOKENS
                </td>
                <td className="p-3 border-b">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      isUnlocked(timeUntilUnlock as bigint | undefined)
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {isUnlocked(timeUntilUnlock as bigint | undefined)
                      ? "Unlocked"
                      : "Locked"}
                  </span>
                </td>
                <td className="p-3 border-b">
                  {isUnlocked(timeUntilUnlock as bigint | undefined) ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Amount to withdraw"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={isWithdrawing}
                        max={formatTokenAmount(stakedAmount)}
                      />
                      <button
                        onClick={handleWithdraw}
                        disabled={!address || isWithdrawing || !withdrawAmount}
                        className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                    >
                      {formatTimeUntilUnlock(
                        timeUntilUnlock as bigint | undefined
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-3 border-b text-center text-gray-500"
                >
                  No active stakes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">All Stakes</h2>
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left border-b">User</th>
              <th className="p-3 text-left border-b">Amount</th>
              <th className="p-3 text-left border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                className="p-3 border-b text-center text-gray-500"
                colSpan={3}
              >
                All stakes data not available - need to implement protocol-wide
                stakes query
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
