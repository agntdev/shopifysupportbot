import "dotenv/config";

import { pathToFileURL } from "node:url";
import { Bot } from "grammy";
import type { Context } from "grammy";
import { buildConfigurationStatus, buildHelpMessage, buildStartMessage } from "./messages.js";
import { getManagedBotUsername, loadBotConfig, type BotConfig } from "./config.js";
import {
  buildHumanEscalationResponse,
  buildLookupErrorResponse,
  buildOrderLookupPrompt,
  buildOrderStatusResponse,
  buildShopifyNotConfiguredResponse,
  buildTrackingNeedsOrderResponse,
} from "./responses/index.js";
import { parseCustomerMessage } from "./routing/index.js";
import { hasShopifyCredentials, loadShopifyConfig, lookupOrderStatus } from "./shopify/index.js";

export const BOT_COMMANDS = [
  { command: "start", description: "Open the Shopify support assistant" },
  { command: "help", description: "Show setup and usage details" },
  { command: "status", description: "Check bot configuration status" },
] as const;

export interface MakeBotOptions {
  token?: string;
  config?: Partial<Pick<BotConfig, "botUsername" | "shopifyShopDomain" | "shopifyConfigured" | "supportEmail">>;
}

function resolveRuntimeConfig(options: MakeBotOptions): Pick<BotConfig, "botUsername" | "shopifyShopDomain" | "shopifyConfigured" | "supportEmail"> {
  const shopifyShopDomain = options.config?.shopifyShopDomain ?? process.env.SHOPIFY_SHOP_DOMAIN?.trim();

  return {
    botUsername: options.config?.botUsername ?? process.env.BOT_USERNAME?.trim() ?? getManagedBotUsername(),
    shopifyShopDomain,
    shopifyConfigured:
      options.config?.shopifyConfigured ??
      Boolean(shopifyShopDomain && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim()),
    supportEmail: options.config?.supportEmail ?? process.env.SUPPORT_EMAIL?.trim(),
  };
}

export function makeBot(options: MakeBotOptions = {}): Bot<Context> {
  const token = options.token ?? process.env.BOT_TOKEN ?? "test-token";
  const runtimeConfig = resolveRuntimeConfig(options);
  const bot = new Bot<Context>(token);

  bot.command("start", async (ctx) => {
    await ctx.reply(buildStartMessage(ctx.from?.first_name, runtimeConfig));
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(buildHelpMessage(runtimeConfig));
  });

  bot.command("status", async (ctx) => {
    await ctx.reply(buildConfigurationStatus(runtimeConfig));
  });

  bot.on("message:text", async (ctx) => {
    const parsedMessage = parseCustomerMessage(ctx.message.text);

    if (parsedMessage.route === "human_escalation") {
      await ctx.reply(buildHumanEscalationResponse(runtimeConfig));
      return;
    }

    if (parsedMessage.route === "help") {
      await ctx.reply(buildHelpMessage(runtimeConfig));
      return;
    }

    if (parsedMessage.route === "tracking_lookup") {
      await ctx.reply(buildTrackingNeedsOrderResponse(runtimeConfig));
      return;
    }

    if (parsedMessage.route === "order_prompt" || !parsedMessage.lookupInput) {
      await ctx.reply(buildOrderLookupPrompt());
      return;
    }

    try {
      if (!hasShopifyCredentials()) {
        await ctx.reply(buildShopifyNotConfiguredResponse(runtimeConfig));
        return;
      }

      const result = await lookupOrderStatus(loadShopifyConfig(), parsedMessage.lookupInput);
      await ctx.reply(buildOrderStatusResponse(result, runtimeConfig));
    } catch (error) {
      console.error("Shopify order lookup failed", error);
      await ctx.reply(buildLookupErrorResponse(runtimeConfig));
    }
  });

  bot.catch((err) => {
    console.error("Unhandled Telegram bot error", {
      updateId: err.ctx.update.update_id,
      error: err.error,
    });
  });

  return bot;
}

export async function startBot(): Promise<void> {
  const config = loadBotConfig();
  const bot = makeBot({ token: config.botToken, config });

  await bot.api.setMyCommands([...BOT_COMMANDS]);
  await bot.start({
    onStart: (botInfo) => {
      console.log(`ShopifySupportBot started as @${botInfo.username}`);
    },
  });
}

const entrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;

if (entrypoint === import.meta.url) {
  startBot().catch((error) => {
    console.error("Failed to start ShopifySupportBot", error);
    process.exitCode = 1;
  });
}
