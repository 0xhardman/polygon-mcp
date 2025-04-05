// 测试1inch Swap功能的脚本
import { spawn } from 'child_process';
import path from 'path';
import readline from 'readline';

// 启动MCP服务器
const mcpProcess = spawn('node', ['build/index.js'], {
  stdio: ['pipe', 'pipe', process.stderr],
  env: { ...process.env },
});

// 创建readline接口用于读取MCP服务器的输出
const rl = readline.createInterface({
  input: mcpProcess.stdout,
  crlfDelay: Infinity
});

// 处理MCP服务器的输出
rl.on('line', (line) => {
  try {
    const message = JSON.parse(line);
    if (message.type === 'response' && message.id === 'swap-test') {
      console.log('\n===== 交易结果 =====');
      const content = JSON.parse(message.response.content[0].text);
      console.log(JSON.stringify(content, null, 2));
      console.log('\n交易查看链接:', content.url);
      
      // 测试完成后退出
      setTimeout(() => {
        console.log('\n测试完成，退出程序...');
        mcpProcess.kill();
        process.exit(0);
      }, 1000);
    }
  } catch (error) {
    // 忽略非JSON输出
  }
});

// 处理错误
mcpProcess.on('error', (error) => {
  console.error('启动MCP服务器时出错:', error);
  process.exit(1);
});

// 处理MCP服务器退出
mcpProcess.on('close', (code) => {
  console.log(`MCP服务器已退出，退出码: ${code}`);
  process.exit(0);
});

// 等待MCP服务器启动
setTimeout(() => {
  console.log('发送1inch swap请求...');
  
  // MATIC代币地址
  const MATIC_ADDRESS = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
  // USDC代币地址
  const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  
  // 构建请求
  const request = {
    id: 'swap-test',
    type: 'call_tool',
    params: {
      name: 'inch_swap',
      arguments: {
        fromTokenAddress: MATIC_ADDRESS,  // 从MATIC
        toTokenAddress: USDC_ADDRESS,     // 兑换成USDC
        amount: '10000000000000000',      // 0.01 MATIC
        // apiKey会从环境变量中自动获取
        slippage: 1                       // 1%滑点
      }
    }
  };
  
  // 发送请求到MCP服务器
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}, 2000);

// 处理程序退出
process.on('SIGINT', () => {
  console.log('\n程序被中断');
  mcpProcess.kill();
  process.exit(0);
});
