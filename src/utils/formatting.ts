import { BigNumber } from "ethers";

export const formatTokenAmount = (
  amount: string,
  decimals: number = 18
): string => {
  try {
    const bn = BigNumber.from(amount);
    const divisor = BigNumber.from(10).pow(decimals);
    const formatted = bn.div(divisor);
    return formatted.toString();
  } catch {
    return "0";
  }
};

export const formatTokenAmountWithDecimals = (
  amount: string,
  decimals: number = 18
): string => {
  try {
    const bn = BigNumber.from(amount);
    const divisor = BigNumber.from(10).pow(decimals);
    const quotient = bn.div(divisor);
    const remainder = bn.mod(divisor);

    if (remainder.isZero()) {
      return quotient.toString();
    }

    const remainderStr = remainder.toString().padStart(decimals, "0");
    const trimmed = remainderStr.replace(/0+$/, "");

    if (trimmed === "") {
      return quotient.toString();
    }

    return `${quotient.toString()}.${trimmed}`;
  } catch {
    return "0";
  }
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

export const formatPercentage = (
  value: string,
  decimals: number = 2
): string => {
  const num = parseFloat(value) / 100; // Assuming basis points
  return `${num.toFixed(decimals)}%`;
};

export const isUnlocked = (unlockTimestamp: string): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return parseInt(unlockTimestamp) <= now;
};

export const getTimeUntilUnlock = (unlockTimestamp: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const unlock = parseInt(unlockTimestamp);
  const diff = unlock - now;

  if (diff <= 0) return "Unlocked";

  const days = Math.floor(diff / (24 * 60 * 60));
  const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
