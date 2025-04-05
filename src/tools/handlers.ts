import {
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  isAddress,
  parseUnits,
  type Abi,
  type AbiFunction,
  type Account,
  type PublicActions,
  type WalletClient,
} from "viem";
import type { z } from "zod";
import type {
  CallContractSchema,
  DeployPropertyNFTSchema,
  DeployPropertyTokenSchema,
  DeployPropertyYieldVaultSchema,
  Erc20BalanceSchema,
  Erc20TransferSchema,
  InchSwapSchema,
} from "./schemas.js";
import { constructPolygonScanUrl } from "../utils/index.js";
import { polygon } from "viem/chains";
import { PropertyNFT } from "../contracts/PropertyNFT.js";
import { PropertyToken } from "../contracts/PropertyToken.js";
import { PropertyYieldVault } from "../contracts/PropertyYieldVault.js";
import axios from "axios";

export async function deployPropertyNFTHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof DeployPropertyNFTSchema>
): Promise<string> {
  if (!wallet.account?.address) {
    throw new Error("No account address available");
  }
  const hash = await wallet.deployContract({
    abi: PropertyNFT.abi,
    account: wallet.account,
    chain: wallet.chain,
    bytecode: PropertyNFT.bytecode as `0x${string}`,
  });

  // Return transaction hash and PolygonScan URL
  return JSON.stringify({
    hash,
    url: constructPolygonScanUrl(wallet.chain ?? polygon, hash),
  });
}

export async function deployPropertyTokenHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof DeployPropertyTokenSchema>
): Promise<string> {
  if (!wallet.account?.address) {
    throw new Error("No account address available");
  }

  // Validate addresses
  if (!isAddress(args.propertyNFTAddress)) {
    throw new Error(`Invalid PropertyNFT address: ${args.propertyNFTAddress}`);
  }

  const hash = await wallet.deployContract({
    abi: PropertyToken.abi,
    account: wallet.account,
    chain: wallet.chain,
    bytecode: PropertyToken.bytecode as `0x${string}`,
    args: [
      args.propertyNFTAddress,
      BigInt(args.propertyId),
      args.name,
      args.symbol,
    ],
  });

  // Return transaction hash and PolygonScan URL
  return JSON.stringify({
    hash,
    url: constructPolygonScanUrl(wallet.chain ?? polygon, hash),
  });
}

export async function deployPropertyYieldVaultHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof DeployPropertyYieldVaultSchema>
): Promise<string> {
  if (!wallet.account?.address) {
    throw new Error("No account address available");
  }

  // Validate addresses
  if (!isAddress(args.assetAddress)) {
    throw new Error(`Invalid asset address: ${args.assetAddress}`);
  }
  if (!isAddress(args.propertyNFTAddress)) {
    throw new Error(`Invalid PropertyNFT address: ${args.propertyNFTAddress}`);
  }

  const hash = await wallet.deployContract({
    abi: PropertyYieldVault.abi,
    account: wallet.account,
    chain: wallet.chain,
    bytecode: PropertyYieldVault.bytecode as `0x${string}`,
    args: [
      args.assetAddress,
      args.name,
      args.symbol,
      args.propertyNFTAddress,
      BigInt(args.propertyId),
    ],
  });

  // Return transaction hash and PolygonScan URL
  return JSON.stringify({
    hash,
    url: constructPolygonScanUrl(wallet.chain ?? polygon, hash),
  });
}

export async function getAddressHandler(
  wallet: WalletClient & PublicActions
): Promise<string> {
  if (!wallet.account?.address) {
    throw new Error("No account address available");
  }
  return wallet.account.address;
}

export async function callContractHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof CallContractSchema>
): Promise<string> {
  let abi: string | Abi = args.abi;
  try {
    abi = JSON.parse(abi) as Abi;
  } catch (error) {
    throw new Error(`Invalid ABI: ${error}`);
  }

  if (!isAddress(args.contractAddress, { strict: false })) {
    throw new Error(`Invalid contract address: ${args.contractAddress}`);
  }
  let functionAbi: AbiFunction | undefined;

  try {
    functionAbi = abi.find(
      (item) => "name" in item && item.name === args.functionName
    ) as AbiFunction;
  } catch (error) {
    throw new Error(`Invalid function name: ${args.functionName}`);
  }

  if (
    functionAbi.stateMutability === "view" ||
    functionAbi.stateMutability === "pure"
  ) {
    const tx = await wallet.readContract({
      address: args.contractAddress,
      abi,
      functionName: args.functionName,
      args: args.functionArgs,
    });

    return String(tx);
  }

  const tx = await wallet.simulateContract({
    account: wallet.account,
    abi,
    address: args.contractAddress,
    functionName: args.functionName,
    value: BigInt(args.value ?? 0),
    args: args.functionArgs,
  });

  const txHash = await wallet.writeContract(tx.request);

  return JSON.stringify({
    hash: txHash,
    url: constructPolygonScanUrl(wallet.chain ?? polygon, txHash),
  });
}

export async function erc20BalanceHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof Erc20BalanceSchema>
): Promise<string> {
  const { contractAddress } = args;

  if (!isAddress(contractAddress, { strict: false })) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  const balance = await wallet.readContract({
    address: contractAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [wallet.account?.address ?? "0x"],
  });

  const decimals = await wallet.readContract({
    address: contractAddress,
    abi: erc20Abi,
    functionName: "decimals",
  });

  return formatUnits(balance, decimals);
}

export async function erc20TransferHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof Erc20TransferSchema>
): Promise<string> {
  const { contractAddress, toAddress, amount } = args;

  if (!isAddress(contractAddress, { strict: false })) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  if (!isAddress(toAddress, { strict: false })) {
    throw new Error(`Invalid to address: ${toAddress}`);
  }

  // Get decimals for token
  const decimals = await wallet.readContract({
    address: contractAddress,
    abi: erc20Abi,
    functionName: "decimals",
  });

  // Format units
  const atomicUnits = parseUnits(amount, decimals);

  const tx = await wallet.simulateContract({
    address: contractAddress,
    abi: erc20Abi,
    functionName: "transfer",
    args: [toAddress, atomicUnits],
    account: wallet.account,
    chain: wallet.chain,
  });

  const txHash = await wallet.writeContract(tx.request);

  return JSON.stringify({
    hash: txHash,
    url: constructPolygonScanUrl(wallet.chain ?? polygon, txHash),
  });
}

export async function getGasPriceHandler(
  wallet: WalletClient & PublicActions
): Promise<string> {
  const gasPrice = await wallet.getGasPrice();
  return formatUnits(gasPrice, 9) + " Gwei";
}

// 1inch Swap Handler
export async function inchSwapHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof InchSwapSchema>
): Promise<string> {
  if (!wallet.account?.address) {
    throw new Error("No account address available");
  }

  const {
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromAddress,
    slippage = 1,
    apiKey,
    chainId = 137, // Default to Polygon
  } = args;

  // 使用当前钱包地址作为默认fromAddress
  const actualFromAddress = fromAddress || wallet.account.address;

  // Validate addresses
  if (!isAddress(fromTokenAddress)) {
    throw new Error(`Invalid fromTokenAddress: ${fromTokenAddress}`);
  }
  if (!isAddress(toTokenAddress)) {
    throw new Error(`Invalid toTokenAddress: ${toTokenAddress}`);
  }
  if (!isAddress(actualFromAddress)) {
    throw new Error(`Invalid fromAddress: ${actualFromAddress}`);
  }

  // 从参数或viemClient中获取API密钥
  const extendedWallet = wallet as any;
  const actualApiKey = apiKey || extendedWallet.oneInchApiKey;
  
  // Check if API key is provided
  if (!actualApiKey) {
    throw new Error("API key is required for 1inch swap");
  }

  try {
    // Step 1: Get swap data from 1inch API
    const headers = {
      accept: "application/json",
      "api-key": actualApiKey
    };

    const swapUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/swap`;
    const swapParams = {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount,
      from: actualFromAddress,
      slippage: slippage.toString(),
      disableEstimate: true,
    };

    // u6253u5370u8bf7u6c42u4fe1u606fuff08u4e0du5305u542bu5b8cu6574u7684APIu5bc6u94a5uff09
    console.log(`1inch API Request to: ${swapUrl}`);
    console.log(`Headers: { accept: "application/json", api-key: "${actualApiKey.substring(0, 3)}..." }`);
    console.log(`Params:`, swapParams);

    try {
      const response = await axios.get(swapUrl, {
        headers,
        params: swapParams,
      });

      const swapData = response.data;

      // Step 2: Execute the transaction
      const tx = {
        from: actualFromAddress,
        to: swapData.tx.to as `0x${string}`,
        data: swapData.tx.data as `0x${string}`,
        value: BigInt(swapData.tx.value || 0),
        gas: BigInt(swapData.tx.gas || 0),
      };

      // Send the transaction
      const hash = await wallet.sendTransaction({
        account: wallet.account,
        to: tx.to,
        data: tx.data,
        value: tx.value,
        gas: tx.gas,
        chain: wallet.chain, // Add chain parameter
      });

      // Return transaction details and estimated result
      return JSON.stringify({
        hash,
        url: constructPolygonScanUrl(wallet.chain ?? polygon, hash),
        fromToken: swapData.fromToken,
        toToken: swapData.toToken,
        fromAmount: swapData.fromAmount,
        toAmount: swapData.toAmount,
        estimatedGas: swapData.tx.gas,
      });
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(
          `1inch API error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`1inch API request error: ${error.message}`);
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`1inch swap error: ${error.message}`);
      }
    }
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      throw new Error(`1inch swap error: ${(error as Error).message}`);
    } else {
      throw new Error(`1inch swap error: ${String(error)}`);
    }
  }
}
