import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  callContractHandler,
  erc20BalanceHandler,
  erc20TransferHandler,
  getGasPriceHandler,
  getAddressHandler,
  deployPropertyNFTHandler,
  deployPropertyTokenHandler,
  deployPropertyYieldVaultHandler,
  inchSwapHandler,
  checkAllowanceHandler,
  approveTokenHandler,
} from "./handlers.js";

const callContractTool: Tool = {
  name: "call_contract",
  description: "Call a contract function on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {
      contractAddress: {
        type: "string",
        description: "The address of the contract to call",
      },
      functionName: {
        type: "string",
        description: "The name of the function to call",
      },
      functionArgs: {
        type: "array",
        description: "The arguments to pass to the function",
        items: {
          type: "string",
        },
      },
      abi: {
        type: "string",
        description: "The ABI of the contract",
      },
    },
    required: ["contractAddress", "functionName", "abi"],
  },
};

const erc20BalanceTool: Tool = {
  name: "erc20_balance",
  description: "Get the balance of an ERC20 token on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {
      contractAddress: {
        type: "string",
        description: "The address of the contract to get the balance of",
      },
    },
    required: ["contractAddress"],
  },
};

const erc20TransferTool: Tool = {
  name: "erc20_transfer",
  description: "Transfer an ERC20 token on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {
      contractAddress: {
        type: "string",
        description: "The address of the contract to transfer the token from",
      },
      toAddress: {
        type: "string",
        description: "The address of the recipient",
      },
      amount: {
        type: "string",
        description: "The amount of tokens to transfer",
      },
    },
    required: ["contractAddress", "toAddress", "amount"],
  },
};

const getGasPriceTool: Tool = {
  name: "get_gas_price",
  description: "Get the current gas price on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const getAddressTool: Tool = {
  name: "get_address",
  description: "Get the address of the current account",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const deployPropertyNFTTool: Tool = {
  name: "deploy_property_nft",
  description: "Deploy a PropertyNFT contract on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const deployPropertyTokenTool: Tool = {
  name: "deploy_property_token",
  description: "Deploy a PropertyToken contract on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {
      propertyNFTAddress: {
        type: "string",
        description: "The address of the PropertyNFT",
      },
      propertyId: {
        type: "string",
        description: "The ID of the property",
      },
      name: {
        type: "string",
        description: "The name of the property",
      },
      symbol: {
        type: "string",
        description: "The symbol of the property",
      },
    },
    required: ["propertyNFTAddress", "propertyId", "name", "symbol"],
  },
};

const deployPropertyYieldVaultTool: Tool = {
  name: "deploy_property_yield_vault",
  description: "Deploy a PropertyYieldVault contract on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {
      assetAddress: {
        type: "string",
        description: "The address of the underlying ERC20 PropertyToken",
      },
      name: {
        type: "string",
        description: "The name of the vault token",
      },
      symbol: {
        type: "string",
        description: "The symbol of the vault token",
      },
      propertyNFTAddress: {
        type: "string",
        description: "The address of the PropertyNFT",
      },
      propertyId: {
        type: "string",
        description: "The ID of the property",
      },
    },
    required: [
      "assetAddress",
      "name",
      "symbol",
      "propertyNFTAddress",
      "propertyId",
    ],
  },
};

// 1inch Swap Tool
const inchSwapTool: Tool = {
  name: "inch_swap",
  description: "Swap tokens using 1inch Exchange on Polygon",
  inputSchema: {
    type: "object",
    properties: {
      fromTokenAddress: {
        type: "string",
        description: "The address of the token to swap from",
      },
      toTokenAddress: {
        type: "string",
        description: "The address of the token to swap to",
      },
      amount: {
        type: "string",
        description: "The amount of tokens to swap in wei",
      },
      fromAddress: {
        type: "string",
        description: "The address to swap from (defaults to current wallet address)",
      },
      slippage: {
        type: "number",
        description: "The maximum acceptable slippage percentage (default: 1)",
      },
      apiKey: {
        type: "string",
        description: "Your 1inch API key",
      },
      chainId: {
        type: "number",
        description: "The chain ID (default: 137 for Polygon)",
      },
    },
    required: ["fromTokenAddress", "toTokenAddress", "amount"],
  },
};

// Check token allowance tool
const checkAllowanceTool: Tool = {
  name: "check_allowance",
  description: "Check the allowance of an ERC20 token for a spender on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {
      tokenAddress: {
        type: "string",
        description: "The address of the token to check allowance for",
      },
      spenderAddress: {
        type: "string",
        description: "The address of the spender to check allowance for",
      },
    },
    required: ["tokenAddress", "spenderAddress"],
  },
};

// Approve token tool
const approveTokenTool: Tool = {
  name: "approve_token",
  description: "Approve a spender to spend an ERC20 token on Polygon PoS",
  inputSchema: {
    type: "object",
    properties: {
      tokenAddress: {
        type: "string",
        description: "The address of the token to approve",
      },
      spenderAddress: {
        type: "string",
        description: "The address of the spender to approve",
      },
      amount: {
        type: "string",
        description: "The amount to approve (in wei). If not provided, max uint256 will be used.",
      },
    },
    required: ["tokenAddress", "spenderAddress"],
  },
};

export const polygonMcpTools: Tool[] = [
  callContractTool,
  erc20BalanceTool,
  erc20TransferTool,
  getGasPriceTool,
  getAddressTool,
  deployPropertyNFTTool,
  deployPropertyTokenTool,
  deployPropertyYieldVaultTool,
  inchSwapTool,
  checkAllowanceTool,
  approveTokenTool,
];

// biome-ignore lint/complexity/noBannedTypes: temp
export const toolToHandler: Record<string, Function> = {
  call_contract: callContractHandler,
  erc20_balance: erc20BalanceHandler,
  erc20_transfer: erc20TransferHandler,
  get_gas_price: getGasPriceHandler,
  get_address: getAddressHandler,
  deploy_property_nft: deployPropertyNFTHandler,
  deploy_property_token: deployPropertyTokenHandler,
  deploy_property_yield_vault: deployPropertyYieldVaultHandler,
  inch_swap: inchSwapHandler,
  check_allowance: checkAllowanceHandler,
  approve_token: approveTokenHandler,
};
