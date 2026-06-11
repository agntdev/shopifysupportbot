import type { ShopifyConfig } from "./config.js";

export interface ShopifyGraphQLErrorItem {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface ShopifyGraphQLResponse<TData> {
  data?: TData;
  errors?: ShopifyGraphQLErrorItem[];
}

export class ShopifyApiError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, options: { status?: number; details?: unknown } = {}) {
    super(message);
    this.name = "ShopifyApiError";
    this.status = options.status;
    this.details = options.details;
  }
}

export async function shopifyAdminGraphql<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
  config: ShopifyConfig,
  query: string,
  variables?: TVariables,
  fetchImpl: typeof fetch = fetch,
): Promise<TData> {
  const response = await fetchImpl(`https://${config.shopDomain}/admin/api/${config.apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.adminAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const rawBody = await response.text();
  const payload = parseJsonBody<ShopifyGraphQLResponse<TData>>(rawBody);

  if (!response.ok) {
    throw new ShopifyApiError(`Shopify Admin API request failed with HTTP ${response.status}.`, {
      status: response.status,
      details: payload ?? rawBody,
    });
  }

  if (!payload) {
    throw new ShopifyApiError("Shopify Admin API returned an empty or invalid JSON response.", {
      status: response.status,
      details: rawBody,
    });
  }

  if (payload.errors?.length) {
    throw new ShopifyApiError(`Shopify Admin API GraphQL error: ${payload.errors.map((error) => error.message).join("; ")}`, {
      status: response.status,
      details: payload.errors,
    });
  }

  if (!payload.data) {
    throw new ShopifyApiError("Shopify Admin API response did not include data.", {
      status: response.status,
      details: payload,
    });
  }

  return payload.data;
}

function parseJsonBody<T>(rawBody: string): T | null {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null;
  }
}
