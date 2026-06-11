export const DEFAULT_SHOPIFY_API_VERSION = "2026-04";

export const REQUIRED_SHOPIFY_SCOPES = ["read_orders", "read_fulfillments"] as const;

export const OPTIONAL_SHOPIFY_SCOPES = ["read_all_orders"] as const;

export interface ShopifyConfig {
  shopDomain: string;
  adminAccessToken: string;
  apiVersion: string;
}

function readTrimmed(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function normalizeShopDomain(value: string): string {
  const withoutProtocol = value.trim().replace(/^https?:\/\//i, "");
  const domain = withoutProtocol.replace(/\/.*$/, "").toLowerCase();

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
    throw new Error("SHOPIFY_SHOP_DOMAIN must be a myshopify.com Admin API domain, for example your-store.myshopify.com.");
  }

  return domain;
}

export function hasShopifyCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(readTrimmed(env, "SHOPIFY_SHOP_DOMAIN") && readTrimmed(env, "SHOPIFY_ADMIN_ACCESS_TOKEN"));
}

export function loadShopifyConfig(env: NodeJS.ProcessEnv = process.env): ShopifyConfig {
  const shopDomain = readTrimmed(env, "SHOPIFY_SHOP_DOMAIN");
  const adminAccessToken = readTrimmed(env, "SHOPIFY_ADMIN_ACCESS_TOKEN");

  if (!shopDomain) {
    throw new Error("SHOPIFY_SHOP_DOMAIN is required to connect to the Shopify Admin API.");
  }

  if (!adminAccessToken) {
    throw new Error("SHOPIFY_ADMIN_ACCESS_TOKEN is required to connect to the Shopify Admin API.");
  }

  return {
    shopDomain: normalizeShopDomain(shopDomain),
    adminAccessToken,
    apiVersion: readTrimmed(env, "SHOPIFY_API_VERSION") ?? DEFAULT_SHOPIFY_API_VERSION,
  };
}
