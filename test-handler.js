// Direct test of inchSwapHandler
import * as dotenv from 'dotenv';
import { createWalletClient, http, publicActions } from 'viem';
import { polygon } from 'viem/chains';
import { mnemonicToAccount } from 'viem/accounts';
import { inchSwapHandler } from './build/tools/handlers.js';
import { POLYGON_RPC_URL } from './build/lib/constants.js';

// Load environment variables
dotenv.config();

async function main() {
  const seedPhrase = process.env.SEED_PHRASE;
  const oneInchApiKey = process.env.ONE_INCH_API_KEY;

  if (!seedPhrase) {
    console.error('SEED_PHRASE environment variable not set');
    process.exit(1);
  }

  if (!oneInchApiKey) {
    console.error('ONE_INCH_API_KEY environment variable not set');
    process.exit(1);
  }

  console.log('Environment variables:');
  console.log('- SEED_PHRASE:', seedPhrase ? '*****' : 'not set');
  console.log('- ONE_INCH_API_KEY:', oneInchApiKey ? '*****' : 'not set');

  // Create viem client
  const viemClient = createWalletClient({
    account: mnemonicToAccount(seedPhrase),
    chain: polygon,
    transport: http(POLYGON_RPC_URL),
  }).extend(publicActions);

  // Add API key to viemClient object
  viemClient.oneInchApiKey = oneInchApiKey;

  console.log('Wallet address:', viemClient.account.address);

  // Test parameter list
  const testParams = [
    //0
    {
      name: 'MATIC to USDT',
      params: {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // MATIC
        toTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',   // USDT
        amount: '10000000000000000', // 0.01 MATIC
        slippage: 3
      }
    },
    //1
    {
      name: 'USDT to WBTC',
      params: {
        fromTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
        toTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',   // WBTC
        amount: '100000', // 0.1 USDT (6 decimals)
        slippage: 3
      }
    },
    //2
    {
      name: 'USDT to MATIC',
      params: {
        fromTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
        toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // MATIC
        amount: '1000000', // 1 USDT (6 decimals)
        slippage: 5
      }
    },
    //3
    {
      name: 'WBTC to MATIC',
      params: {
        fromTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
        toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // MATIC
        amount: '2000', // 0.00002 WBTC (8 decimals)
        slippage: 1
      }
    },
    //4
    {
      name: 'MATIC to USDC',
      params: {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // MATIC
        toTokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',   // USDC
        amount: '10000000000000000', // 0.01 MATIC
        slippage: 3
      }
    },
    //5
    {
      name: 'MATIC to WBTC',
      params: {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // MATIC
        toTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',   // WBTC
        amount: '10000000000000000', // 0.01 MATIC
        slippage: 5
      }
    },
    //6
    {
      name: 'WBTC to MATIC',
      params: {
        fromTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
        toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // MATIC
        amount: '1000', // 0.00001 WBTC (8 decimals)
        slippage: 3
      }
    },
    //7
    {
      name: 'WBTC to USDC',
      params: {
        fromTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
        toTokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',   // MATIC
        amount: '1000', // 0.00001 WBTC (8 decimals)
        slippage: 3
      }
    },
    //8
    {
      name: 'USDC to WBTC',
      params: {
        fromTokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // MATIC
        toTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',   // WBTC
        amount: '4000000', // 4 USDC (6 decimals)
        slippage: 3
      }
    }
  ];

  // Select parameter set to test
  const testIndex = 8; // Modify this index to test different swap pairs
  const swapParams = testParams[testIndex].params;

  console.log(`Testing inchSwapHandler function... (${testParams[testIndex].name})`);
  console.log('Parameters:', swapParams);

  try {
    // Check ERC20 balance
    if (swapParams.fromTokenAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      try {
        const erc20Abi = [
          {
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "name": "", "type": "uint8" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
          }
        ];

        // Get token decimals
        const decimals = await viemClient.readContract({
          address: swapParams.fromTokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
        });
        console.log('ERC20 decimals:', decimals);

        // Get token balance
        const balance = await viemClient.readContract({
          address: swapParams.fromTokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [viemClient.account.address],
        });
        console.log('ERC20 balance:', balance.toString(), `(${Number(balance) / Math.pow(10, decimals)} ERC20)`);

        // Check if balance is sufficient
        const amountBigInt = BigInt(swapParams.amount);
        if (balance < amountBigInt) {
          const errorMessage = `Insufficient ERC20 balance! Need ${Number(amountBigInt) / Math.pow(10, decimals)} ERC20, but only have ${Number(balance) / Math.pow(10, decimals)} ERC20`;
          console.error('Failed to check ERC20 balance:', errorMessage);
          // Exit early when balance is insufficient
          process.exit(1);
        }
      } catch (error) {
        console.error('Failed to check ERC20 balance:', error.message);
      }
    }

    // Directly call inchSwapHandler function
    const result = await inchSwapHandler(viemClient, swapParams);
    console.log('Success! Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(error => {
  console.error('Execution error:', error);
  process.exit(1);
});
