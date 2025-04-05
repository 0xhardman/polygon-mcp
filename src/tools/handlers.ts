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
  checkAllowanceSchema,
  approveTokenSchema,
  GetTokenDecimalsSchema
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
    fromTokenAddress: originalFromTokenAddress,
    toTokenAddress: originalToTokenAddress,
    amount,
    fromAddress,
    slippage = 1,
    apiKey,
    chainId = 137, // Default to Polygon
  } = args;

  // Check and replace USDC.e address with native USDC address
  const USDC_E_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const NATIVE_USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

  // Replace USDC.e with native USDC if detected
  const fromTokenAddress = originalFromTokenAddress === USDC_E_ADDRESS
    ? NATIVE_USDC_ADDRESS
    : originalFromTokenAddress;

  const toTokenAddress = originalToTokenAddress === USDC_E_ADDRESS
    ? NATIVE_USDC_ADDRESS
    : originalToTokenAddress;

  // Log if a replacement was made
  if (originalFromTokenAddress === USDC_E_ADDRESS) {
    console.log("Automatically replaced USDC.e with native USDC in fromTokenAddress");
  }
  if (originalToTokenAddress === USDC_E_ADDRESS) {
    console.log("Automatically replaced USDC.e with native USDC in toTokenAddress");
  }

  // Use current wallet address as default fromAddress
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

  // Get API key from parameters or viemClient
  const extendedWallet = wallet as any;
  const actualApiKey = apiKey || extendedWallet.oneInchApiKey;

  // Check if API key is provided
  if (!actualApiKey) {
    throw new Error("API key is required for 1inch swap");
  }

  // Step 1: Get swap data from 1inch API
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${actualApiKey}`
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

  // Print request information (without full API key)
  console.log(`1inch API Request to: ${swapUrl}`);
  console.log(`Headers: { accept: "application/json", Authorization: "Bearer ${actualApiKey.substring(0, 3)}..." }`);
  console.log(`Params:`, swapParams);

  const response = await axios.get(swapUrl, {
    headers,
    params: swapParams,
  });

  const swapData = response.data;

  // Print the complete API response for debugging
  console.log('Complete 1inch API response:', JSON.stringify(swapData, null, 2));

  // Step 2: Execute the transaction
  const txData = swapData.tx;
  console.log('1inch transaction data:', JSON.stringify(txData, null, 2));

  if (swapData.protocols) {
    console.log('- Protocols used:', JSON.stringify(swapData.protocols, null, 2));
  }

  // Check wallet balance
  const balance = await wallet.getBalance({ address: actualFromAddress });
  console.log(`Wallet balance: ${balance} wei`);

  // If it's an ERC20 token, check authorization
  if (fromTokenAddress !== '0xEeeeeEeeeEeEeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
    console.log('Checking ERC20 token approval...');

    // Check current approval amount
    const allowance = await wallet.readContract({
      address: fromTokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [actualFromAddress, txData.to],
    }) as bigint;

    console.log(`Current approval amount: ${allowance} wei`);

    // If approval amount is insufficient, throw an error instructing to use approveTokenHandler
    if (allowance < BigInt(amount)) {
      throw new Error(
        `Insufficient token approval. Please use the approveToken tool first with these parameters:\n` +
        `- tokenAddress: ${fromTokenAddress}\n` +
        `- spenderAddress: ${txData.to}\n` +
        `- amount: at least ${amount} wei`
      );
    }
  }

  // Ensure gas parameter is set
  if (!txData.gas || txData.gas === 0) {
    try {
      // Estimate gas usage
      const gasEstimate = await wallet.estimateGas({
        account: wallet.account,
        to: txData.to as `0x${string}`,
        data: txData.data as `0x${string}`,
        value: BigInt(txData.value || '0'),
      });

      // Add 20% buffer
      txData.gas = (gasEstimate * 120n / 100n).toString();
      console.log(`Estimated gas with 20% buffer: ${txData.gas}`);
    } catch (error) {
      // If estimation fails, use a safe default
      // console.error('Gas estimation failed:', error);
      txData.gas = '300000'; // Safe default for most swaps
      // console.log(`Using default gas limit: ${txData.gas}`);
    }
  }

  const tx = {
    from: actualFromAddress,
    to: txData.to as `0x${string}`,
    data: txData.data as `0x${string}`,
    value: BigInt(txData.value || 0),
    gas: BigInt(txData.gas),
  };

  // Send the transaction
  console.log('Sending transaction with parameters:', {
    to: tx.to,
    value: tx.value.toString(),
    gas: tx.gas.toString(),
  });

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
}

// Check token allowance handler
export async function checkAllowanceHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof checkAllowanceSchema>
): Promise<string> {
  if (!wallet.account?.address) {
    throw new Error("No account address available");
  }

  const { tokenAddress, spenderAddress } = args;

  // Validate addresses
  if (!isAddress(tokenAddress)) {
    throw new Error(`Invalid tokenAddress: ${tokenAddress}`);
  }
  if (!isAddress(spenderAddress)) {
    throw new Error(`Invalid spenderAddress: ${spenderAddress}`);
  }

  try {
    // Check current approval amount
    const allowance = await wallet.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [wallet.account.address, spenderAddress],
    }) as bigint;

    return allowance.toString();
  } catch (error) {
    console.error('Failed to check approval amount:', error);
    throw new Error(`Failed to check approval amount: ${(error as Error).message}`);
  }
}

// Approve token handler
export async function approveTokenHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof approveTokenSchema>
): Promise<string> {
  if (!wallet.account?.address) {
    throw new Error("No account address available");
  }

  const { tokenAddress, spenderAddress, amount } = args;

  // Validate addresses
  if (!isAddress(tokenAddress)) {
    throw new Error(`Invalid tokenAddress: ${tokenAddress}`);
  }
  if (!isAddress(spenderAddress)) {
    throw new Error(`Invalid spenderAddress: ${spenderAddress}`);
  }

  try {
    // Default to maximum approval
    const maxApproval = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'); // 2^256 - 1
    const approvalAmount = amount ? BigInt(amount) : maxApproval;

    // Execute approval transaction
    const hash = await wallet.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spenderAddress, approvalAmount],
      account: wallet.account,
      chain: wallet.chain
    });

    return JSON.stringify({
      hash,
      url: constructPolygonScanUrl(wallet.chain ?? polygon, hash),
      tokenAddress,
      spenderAddress,
      amount: approvalAmount.toString(),
    });
  } catch (error) {
    console.error('Failed to approve token:', error);
    throw new Error(`Failed to approve token: ${(error as Error).message}`);
  }
}

// Get token decimals handler
export async function getTokenDecimalsHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof GetTokenDecimalsSchema>
): Promise<string> {
  if (!wallet.account?.address) {
    throw new Error("No account address available");
  }

  const { tokenAddress } = args;

  // Validate addresses
  if (!isAddress(tokenAddress)) {
    throw new Error(`Invalid tokenAddress: ${tokenAddress}`);
  }

  try {
    // Get decimals for token
    const decimals = await wallet.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals",
    });

    return decimals.toString();
  } catch (error) {
    console.error('Failed to get token decimals:', error);
    throw new Error(`Failed to get token decimals: ${(error as Error).message}`);
  }
}
