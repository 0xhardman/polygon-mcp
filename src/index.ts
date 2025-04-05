import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { version } from "./version.js";
import * as dotenv from "dotenv";
import { mnemonicToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { createWalletClient, http, publicActions } from "viem";
import { polygonMcpTools, toolToHandler } from "./tools/index.js";
import { POLYGON_RPC_URL } from "./lib/constants.js";

// 扩展viemClient类型，添加oneInchApiKey属性
type ExtendedViemClient = ReturnType<typeof createWalletClient> & 
  ReturnType<typeof publicActions> & 
  { oneInchApiKey?: string };

async function main() {
  dotenv.config();
  const seedPhrase = process.env.SEED_PHRASE;
  const oneInchApiKey = process.env.ONE_INCH_API_KEY;

  // 打印环境变量，用于调试
  console.log("Environment variables:");
  console.log("- SEED_PHRASE:", seedPhrase ? "*****" : "not set");
  console.log("- ONE_INCH_API_KEY:", oneInchApiKey ? "*****" : "not set");

  if (!seedPhrase) {
    console.error(
      "Please set SEED_PHRASE environment variable",
    );
    process.exit(1);
  }

  if (!oneInchApiKey) {
    console.warn(
      "ONE_INCH_API_KEY environment variable not set. 1inch swap functionality will be limited."
    );
  }

  const viemClient = createWalletClient({
    account: mnemonicToAccount(seedPhrase),
    chain: polygon,
    transport: http(POLYGON_RPC_URL),
  }).extend(publicActions) as ExtendedViemClient;

  // 将环境变量添加到viemClient对象中，以便在处理程序中访问
  viemClient.oneInchApiKey = oneInchApiKey;

  const server = new Server(
    {
      name: "Polygon MCP Server",
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: polygonMcpTools,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const tool = toolToHandler[request.params.name];
      if (!tool) {
        throw new Error(`Tool ${request.params.name} not found`);
      }

      // 确保arguments存在
      const args = request.params.arguments || {};
      
      // 如果是1inch swap工具且没有提供API密钥，则使用环境变量中的API密钥
      if (request.params.name === "inch_swap" && !args.apiKey && viemClient.oneInchApiKey) {
        args.apiKey = viemClient.oneInchApiKey;
      }

      const result = await tool(viemClient, args);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Tool ${request.params.name} failed: ${error}`);
    }
  });

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);
  console.error("Polygon MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
