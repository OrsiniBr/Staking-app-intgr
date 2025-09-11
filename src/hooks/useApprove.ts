import { contractAbi, tokenAbi } from "../config/abi";
import React, { useCallback } from "react";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";

export const useApprove = () => {
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
        return false;
      }

      const contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS;
      const tokenAddress = process.env.NEXT_PUBLIC_STAKING_TOKEN_ADDRESS;

      if (!contractAddress || !tokenAddress) {
        toast.error("Contract addresses not set");
        return false;
      }

      if (!publicClient) {
        toast.error("Public client not available");
        return false;
      }

      try {
        const amountInWei = BigInt(amount * 10 ** 18);

        // Approve tokens
        const approveHash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: tokenAbi,
          functionName: "approve",
          args: [contractAddress, amountInWei],
        });

        console.log("Approve txHash: ", approveHash);

        // Wait for approval
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        });

        if (approveReceipt.status === "success") {
          toast.success("Approval successful", {
            description: "Tokens approved for staking",
          });
          return true;
        } else {
          toast.error("Approval failed", {
            description: "Token approval transaction failed",
          });
          return false;
        }
      } catch (error) {
        console.error("Approval error:", error);
        toast.error("Approval failed", {
          description: "Something went wrong during approval",
        });
        return false;
      }
    },
    [address, walletClient, publicClient, writeContractAsync]
  );
};
