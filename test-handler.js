// 直接测试inchSwapHandler
import * as dotenv from 'dotenv';
import { createWalletClient, http, publicActions } from 'viem';
import { polygon } from 'viem/chains';
import { mnemonicToAccount } from 'viem/accounts';
import { inchSwapHandler } from './build/tools/handlers.js';
import { POLYGON_RPC_URL } from './build/lib/constants.js';

// 加载环境变量
dotenv.config();

async function main() {
  const seedPhrase = process.env.SEED_PHRASE;
  const oneInchApiKey = process.env.ONE_INCH_API_KEY;

  if (!seedPhrase) {
    console.error('SEED_PHRASE环境变量未设置');
    process.exit(1);
  }

  if (!oneInchApiKey) {
    console.error('ONE_INCH_API_KEY环境变量未设置');
    process.exit(1);
  }

  console.log('环境变量:');
  console.log('- SEED_PHRASE:', seedPhrase ? '*****' : '未设置');
  console.log('- ONE_INCH_API_KEY:', oneInchApiKey ? '*****' : '未设置');

  // 创建viem客户端
  const viemClient = createWalletClient({
    account: mnemonicToAccount(seedPhrase),
    chain: polygon,
    transport: http(POLYGON_RPC_URL),
  }).extend(publicActions);

  // 将API密钥添加到viemClient对象中
  viemClient.oneInchApiKey = oneInchApiKey;

  console.log('钱包地址:', viemClient.account.address);

  // 测试参数列表
  const testParams = [
    {
      name: 'MATIC到USDT',
      params: {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // MATIC
        toTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',   // USDT
        amount: '5000000000000000', // 0.005 MATIC
        slippage: 3
      }
    },
    {
      name: 'USDT到WBTC',
      params: {
        fromTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
        toTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',   // WBTC
        amount: '100000', // 0.1 USDT (6位小数)
        slippage: 3
      }
    },
    {
      name: 'USDT到WMATIC',
      params: {
        fromTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
        toTokenAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',   // WMATIC
        amount: '1000000', // 1 USDT (6位小数)
        slippage: 1
      }
    },
    {
      name: 'WBTC到MATIC',
      params: {
        fromTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
        toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // MATIC
        amount: '2000', // 0.00002 WBTC (8位小数)
        slippage: 1
      }
    },
    {
      name: 'MATIC到USDC.e',
      params: {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // MATIC
        toTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',   // USDC.e
        amount: '3000000000000000', // 0.003 MATIC
        slippage: 3
      }
    },
    {
      name: 'MATIC到WBTC',
      params: {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // MATIC
        toTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',   // WBTC
        amount: '5000000000000000', // 0.005 MATIC
        slippage: 3
      }
    },
    {
      name: 'WBTC到MATIC',
      params: {
        fromTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
        toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // MATIC
        amount: '1000', // 0.00001 WBTC (8位小数)
        slippage: 3
      }
    }
  ];

  // 选择要测试的参数集
  const testIndex = 5; // 修改此索引以测试不同的交换对
  const swapParams = testParams[testIndex].params;

  console.log(`测试inchSwapHandler函数... (${testParams[testIndex].name})`);
  console.log('参数:', swapParams);

  try {
    // 检查ERC20余额
    if (swapParams.fromTokenAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      console.log(`检查${testParams[testIndex].name}的ERC20余额...`);
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

        // 检查ERC20小数位数
        const decimals = await viemClient.readContract({
          address: swapParams.fromTokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
        });

        // 检查ERC20余额
        const balance = await viemClient.readContract({
          address: swapParams.fromTokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [viemClient.account.address],
        });

        console.log(`ERC20小数位数: ${decimals}`);
        console.log(`ERC20余额: ${balance} (${Number(balance) / Math.pow(10, decimals)} ERC20)`);

        // 如果余额不足，则抛出错误
        if (BigInt(balance) < BigInt(swapParams.amount)) {
          throw new Error(`ERC20余额不足！需要${Number(swapParams.amount) / Math.pow(10, decimals)} ERC20，但只有${Number(balance) / Math.pow(10, decimals)} ERC20`);
        }
      } catch (error) {
        console.error(`检查ERC20余额失败: ${error.message}`);
      }
    }

    // 直接调用inchSwapHandler函数
    const result = await inchSwapHandler(viemClient, swapParams);
    console.log('成功！结果:', result);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

main().catch(error => {
  console.error('执行出错:', error);
  process.exit(1);
});
