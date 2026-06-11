import type { ShopifyConfig } from "./config.js";
import { shopifyAdminGraphql } from "./client.js";

export interface OrderLookupInput {
  orderName?: string;
  email?: string;
  limit?: number;
}

export interface TrackingInfo {
  company?: string | null;
  number?: string | null;
  url?: string | null;
}

export interface OrderStatus {
  id: string;
  name: string;
  email?: string | null;
  createdAt: string;
  processedAt?: string | null;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus: string;
  totalPrice?: {
    amount: string;
    currencyCode: string;
  };
  fulfillments: Array<{
    status: string;
    trackingInfo: TrackingInfo[];
  }>;
}

export interface OrderStatusLookupResult {
  found: boolean;
  query: string;
  orders: OrderStatus[];
}

interface OrdersQueryResponse {
  orders: {
    edges: Array<{
      node: ShopifyOrderNode;
    }>;
  };
}

interface ShopifyOrderNode {
  id: string;
  name: string;
  email?: string | null;
  createdAt: string;
  processedAt?: string | null;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus: string;
  totalPriceSet?: {
    shopMoney?: {
      amount: string;
      currencyCode: string;
    };
  };
  fulfillments: Array<{
    status: string;
    trackingInfo: TrackingInfo[];
  }>;
}

const ORDER_STATUS_QUERY = `#graphql
  query ShopifySupportBotOrderStatus($query: String!, $first: Int!) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          email
          createdAt
          processedAt
          cancelledAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          fulfillments(first: 10) {
            status
            trackingInfo(first: 10) {
              company
              number
              url
            }
          }
        }
      }
    }
  }
`;

export function parseOrderLookupText(text: string): OrderLookupInput | null {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const orderName = text.match(/#?\d{3,}(?:-[A-Za-z0-9]+)?/)?.[0];

  if (!email && !orderName) {
    return null;
  }

  return {
    email,
    orderName,
  };
}

export function buildOrderSearchQuery(input: OrderLookupInput): string {
  const terms: string[] = [];

  if (input.orderName) {
    terms.push(`name:${quoteSearchValue(input.orderName.replace(/^#/, ""))}`);
  }

  if (input.email) {
    terms.push(`email:${quoteSearchValue(input.email.toLowerCase())}`);
  }

  if (terms.length === 0) {
    throw new Error("Order lookup requires an order number/name or checkout email.");
  }

  return terms.join(" AND ");
}

export async function lookupOrderStatus(
  config: ShopifyConfig,
  input: OrderLookupInput,
  fetchImpl?: typeof fetch,
): Promise<OrderStatusLookupResult> {
  const query = buildOrderSearchQuery(input);
  const first = Math.min(Math.max(input.limit ?? 3, 1), 10);
  const data = await shopifyAdminGraphql<OrdersQueryResponse, { query: string; first: number }>(
    config,
    ORDER_STATUS_QUERY,
    { query, first },
    fetchImpl,
  );
  const orders = data.orders.edges.map(({ node }) => mapOrder(node));

  return {
    found: orders.length > 0,
    query,
    orders,
  };
}

export function formatOrderStatusResult(result: OrderStatusLookupResult): string {
  if (!result.found) {
    return "I could not find an order matching those details. Check the order number or checkout email and try again.";
  }

  return result.orders.map(formatOrderStatus).join("\n\n");
}

export function formatOrderStatus(order: OrderStatus): string {
  const lines = [
    `Order ${order.name}`,
    `Payment: ${formatStatus(order.displayFinancialStatus)}`,
    `Fulfillment: ${formatStatus(order.displayFulfillmentStatus)}`,
  ];

  if (order.totalPrice) {
    lines.push(`Total: ${order.totalPrice.amount} ${order.totalPrice.currencyCode}`);
  }

  const tracking = order.fulfillments.flatMap((fulfillment) => fulfillment.trackingInfo).filter((item) => item.number || item.url);
  if (tracking.length > 0) {
    lines.push("Tracking:");
    for (const item of tracking) {
      const label = [item.company, item.number].filter(Boolean).join(" ");
      lines.push(`- ${label || "Tracking link"}${item.url ? `: ${item.url}` : ""}`);
    }
  }

  if (order.cancelledAt) {
    lines.push("This order is cancelled.");
  }

  return lines.join("\n");
}

function mapOrder(order: ShopifyOrderNode): OrderStatus {
  return {
    id: order.id,
    name: order.name,
    email: order.email,
    createdAt: order.createdAt,
    processedAt: order.processedAt,
    cancelledAt: order.cancelledAt,
    displayFinancialStatus: order.displayFinancialStatus,
    displayFulfillmentStatus: order.displayFulfillmentStatus,
    totalPrice: order.totalPriceSet?.shopMoney,
    fulfillments: order.fulfillments ?? [],
  };
}

function quoteSearchValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function formatStatus(status: string | null | undefined): string {
  return status ? status.toLowerCase().replace(/_/g, " ") : "unknown";
}
