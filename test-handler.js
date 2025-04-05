// u76f4u63a5u6d4bu8bd5inchSwapHandler
import * as dotenv from 'dotenv';
import { createWalletClient, http, publicActions } from 'viem';
import { polygon } from 'viem/chains';
import { mnemonicToAccount } from 'viem/accounts';
import { inchSwapHandler } from './build/tools/handlers.js';
import { POLYGON_RPC_URL } from './build/lib/constants.js';

// u52a0u8f7du73afu5883u53d8u91cf
dotenv.config();

async function main() {
  const seedPhrase = process.env.SEED_PHRASE;
  const oneInchApiKey = process.env.ONE_INCH_API_KEY;

  if (!seedPhrase) {
    console.error('SEED_PHRASEu73afu5883u53d8u91cfu672au8bbeu7f6e');
    process.exit(1);
  }

  if (!oneInchApiKey) {
    console.error('ONE_INCH_API_KEYu73afu5883u53d8u91cfu672au8bbeu7f6e');
    process.exit(1);
  }

  console.log('u73afu5883u53d8u91cf:');
  console.log('- SEED_PHRASE:', seedPhrase ? '*****' : 'u672au8bbeu7f6e');
  console.log('- ONE_INCH_API_KEY:', oneInchApiKey ? '*****' : 'u672au8bbeu7f6e');

  // u521bu5efaviemu5ba2u6237u7aef
  const viemClient = createWalletClient({
    account: mnemonicToAccount(seedPhrase),
    chain: polygon,
    transport: http(POLYGON_RPC_URL),
  }).extend(publicActions);

  // u5c06APIu5bc6u94a5u6dfbu52a0u5230viemClientu5bf9u8c61u4e2d
  viemClient.oneInchApiKey = oneInchApiKey;

  console.log('u94b1u5305u5730u5740:', viemClient.account.address);

  // u6d4bu8bd5u53c2u6570 - u4f7fu7528u539fu751fMATICu800cu4e0du662fWMATIC
  const swapParams = {
    fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // u539fu751fMATIC
    toTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',   // USDC
    amount: '10000000000000000', // 0.01 MATIC
    slippage: 1
  };

  console.log('u6d4bu8bd5inchSwapHandleru51fdu6570...');
  console.log('u53c2u6570:', swapParams);

  try {
    // u76f4u63a5u8c03u7528inchSwapHandleru51fdu6570
    const result = await inchSwapHandler(viemClient, swapParams);
    console.log('u6210u529f! u7ed3u679c:', result);
  } catch (error) {
    console.error('u9519u8bef:', error.message);
  }
}

main().catch(error => {
  console.error('u6267u884cu51fau9519:', error);
  process.exit(1);
});
