import { z } from "zod";

export const CallContractSchema = z.object({
  contractAddress: z.string().describe("The address of the contract to call"),
  functionName: z.string().describe("The name of the function to call"),
  functionArgs: z
    .array(z.string())
    .describe("The arguments to pass to the function"),
  abi: z.string().describe("The ABI of the contract"),
  value: z
    .string()
    .optional()
    .describe("The value of MATIC to send with the transaction"),
});

export const Erc20BalanceSchema = z.object({
  contractAddress: z
    .string()
    .describe("The address of the contract to get the balance of"),
});

export const Erc20TransferSchema = z.object({
  contractAddress: z
    .string()
    .describe("The address of the contract to transfer the token from"),
  toAddress: z.string().describe("The address of the recipient"),
  amount: z.string().describe("The amount of tokens to transfer"),
});

export const GetGasPriceSchema = z.object({});

export const GetAddressSchema = z.object({});

export const DeployPropertyNFTSchema = z.object({});

export const DeployPropertyTokenSchema = z.object({
  propertyNFTAddress: z.string().describe("The address of the PropertyNFT"),
  propertyId: z.string().describe("The ID of the property"),
  name: z
    .string()
    .describe("The token name for the fractional ownership token"),
  symbol: z
    .string()
    .describe("The token symbol for the fractional ownership token"),
});

export const DeployPropertyYieldVaultSchema = z.object({
  assetAddress: z
    .string()
    .describe(
      "The address of the underlying ERC20 PropertyToken that this vault accepts"
    ),
  name: z
    .string()
    .describe(
      "The name of the vault token (e.g., 'Apartment Building Yield Vault')"
    ),
  symbol: z.string().describe("The symbol of the vault token (e.g., 'aREITS')"),
  propertyNFTAddress: z
    .string()
    .describe(
      "The address of the PropertyNFT contract containing the real-world asset information"
    ),
  propertyId: z
    .string()
    .describe("The ID of the specific property NFT this vault is linked to"),
});

// 1inch Swap Schema
export const InchSwapSchema = z.object({
  fromTokenAddress: z.string().describe("The address of the token to swap from"),
  toTokenAddress: z.string().describe("The address of the token to swap to"),
  amount: z.string().describe("The amount of tokens to swap in wei"),
  fromAddress: z.string().optional().describe("The address to swap from (defaults to current wallet address)"),
  slippage: z.number().optional().describe("The maximum acceptable slippage percentage (default: 1)"),
  apiKey: z.string().optional().describe("Your 1inch API key"),
  chainId: z.number().optional().describe("The chain ID (default: 137 for Polygon)"),
});

export type ApproveTokenSchema = {
  tokenAddress: string;
  spenderAddress: string;
  amount?: string;
};

export const approveTokenSchema = z.object({
  tokenAddress: z.string().describe("The address of the token to approve"),
  spenderAddress: z.string().describe("The address of the spender to approve"),
  amount: z.string().optional().describe("The amount to approve (in wei). If not provided, max uint256 will be used."),
});

export type CheckAllowanceSchema = {
  tokenAddress: string;
  spenderAddress: string;
};

export const checkAllowanceSchema = z.object({
  tokenAddress: z.string().describe("The address of the token to check allowance for"),
  spenderAddress: z.string().describe("The address of the spender to check allowance for"),
});

export type GetTokenDecimalsSchema = {
  tokenAddress: string;
};

export const GetTokenDecimalsSchema = z.object({
  tokenAddress: z.string().describe("The address of the token to get decimals for"),
});
