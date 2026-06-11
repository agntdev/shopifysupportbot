import type { BotConfig } from "./config.js";

export function buildStartMessage(firstName: string | undefined, config: Pick<BotConfig, "supportEmail">): string {
  const greeting = firstName ? `Hi ${firstName}.` : "Hi.";
  const lines = [
    `${greeting} I can help with Shopify order support.`,
    "",
    "Send an order number, tracking number, or order email and I will look up the latest status once Shopify access is connected.",
  ];

  if (config.supportEmail) {
    lines.push("", `For urgent help, contact ${config.supportEmail}.`);
  }

  return lines.join("\n");
}

export function buildHelpMessage(config: Pick<BotConfig, "botUsername" | "shopifyShopDomain" | "supportEmail">): string {
  const lines = [
    "ShopifySupportBot setup",
    "",
    `Bot: @${config.botUsername}`,
    config.shopifyShopDomain ? `Shopify store: ${config.shopifyShopDomain}` : "Shopify store: not configured yet",
    "",
    "Available commands:",
    "/start - Open the support assistant",
    "/help - Show setup and usage details",
    "/status - Check bot configuration status",
  ];

  if (config.supportEmail) {
    lines.push("", `Human support: ${config.supportEmail}`);
  }

  return lines.join("\n");
}

export function buildConfigurationStatus(config: Pick<BotConfig, "botUsername" | "shopifyShopDomain" | "supportEmail">): string {
  return [
    "Configuration status",
    "",
    `Telegram bot: @${config.botUsername}`,
    `Shopify store domain: ${config.shopifyShopDomain ? "configured" : "pending"}`,
    `Human support email: ${config.supportEmail ? "configured" : "pending"}`,
  ].join("\n");
}
