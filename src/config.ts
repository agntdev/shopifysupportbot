export interface BotConfig {
  botToken: string;
  botUsername: string;
  shopifyShopDomain?: string;
  shopifyConfigured: boolean;
  supportEmail?: string;
}

const MANAGED_BOT_USERNAME = "shopifysupportbot_hg37nz_bot";

function readTrimmed(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function loadBotConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  const botToken = readTrimmed(env, "BOT_TOKEN");

  if (!botToken) {
    throw new Error(
      "BOT_TOKEN is required. Create or connect the Telegram bot through BotFather/agnt and inject the token through the environment.",
    );
  }

  return {
    botToken,
    botUsername: readTrimmed(env, "BOT_USERNAME") ?? MANAGED_BOT_USERNAME,
    shopifyShopDomain: readTrimmed(env, "SHOPIFY_SHOP_DOMAIN"),
    shopifyConfigured: Boolean(readTrimmed(env, "SHOPIFY_SHOP_DOMAIN") && readTrimmed(env, "SHOPIFY_ADMIN_ACCESS_TOKEN")),
    supportEmail: readTrimmed(env, "SUPPORT_EMAIL"),
  };
}

export function getManagedBotUsername(): string {
  return MANAGED_BOT_USERNAME;
}
