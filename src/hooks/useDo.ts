import { contractAbi, tokenAbi } from "../config/abi";
import React, { useCallback } from "react";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";


// Hook for staking tokens (assumes approval already done)
export const useStake = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(
    async (amount: number) => {
      if (!address || !walletClient) {
        toast.error("Not Connected", {
          description: "Ode!, connect wallet",
        });
        return;
      }

      const contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS;

      if (!contractAddress) {
        toast.error("Contract address not set");
        return;
      }

      if (!publicClient) {
        toast.error("Public client not available");
        return;
      }

      try {
        const amountInWei = BigInt(amount * 10 ** 18);

        // Stake tokens
        const stakeHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: contractAbi,
          functionName: "stake",
          args: [amountInWei],
        });

        console.log("Stake txHash: ", stakeHash);

        // Wait for stake transaction
        const stakeReceipt = await publicClient.waitForTransactionReceipt({
          hash: stakeHash,
        });

        if (stakeReceipt.status === "success") {
          toast.success("Staking successful", {
            description: "You have successfully staked your tokens",
          });
        } else {
          toast.error("Staking failed", {
            description: "Staking transaction failed",
          });
        }
      } catch (error) {
        console.error("Staking error:", error);
        toast.error("Transaction failed", {
          description: "Something went wrong during staking",
        });
      }
    },
    [address, walletClient, publicClient, writeContractAsync]
  );
};

// Usage in your component:
/*
import { useApprove, useStake } from '@/hooks/useStake'

export default function Dashboard() {
  const [stakeAmount, setStakeAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isStaking, setIsStaking] = useState(false)
  
  const approveTokens = useApprove()
  const stakeTokens = useStake()

  const handleApprove = async () => {
    if (!stakeAmount) return
    setIsApproving(true)
    try {
      await approveTokens(parseFloat(stakeAmount))
    } finally {
      setIsApproving(false)
    }
  }

  const handleStake = async () => {
    if (!stakeAmount) return
    setIsStaking(true)
    try {
      await stakeTokens(parseFloat(stakeAmount))
      setStakeAmount('')
    } finally {
      setIsStaking(false)
    }
  }

  return (
    <div>
      <input
        type="number"
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
        placeholder="Enter amount"
      />
      <button onClick={handleApprove} disabled={isApproving || !stakeAmount}>
        {isApproving ? 'Approving...' : 'Approve'}
      </button>
      <button onClick={handleStake} disabled={isStaking || !stakeAmount}>
        {isStaking ? 'Staking...' : 'Stake'}
      </button>
    </div>
  )
}
*/
