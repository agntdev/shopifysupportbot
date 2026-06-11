import type { OrderStatus, OrderStatusLookupResult, TrackingInfo } from "../shopify/index.js";

export interface ResponseTemplateOptions {
  supportEmail?: string;
}

export const RESPONSE_TEMPLATES = {
  orderLookupPrompt:
    "Please send an order number like #1001 or the email address used at checkout, and I will check the latest order status.",
  shopifyNotConfigured:
    "Shopify order lookup is not fully configured yet. Please try again later or contact support if the request is urgent.",
  lookupError:
    "I could not reach Shopify right now. Please try again shortly or contact support if the request is urgent.",
  orderNotFound:
    "I could not find an order matching those details. Please check the order number or checkout email and try again.",
  trackingNeedsOrder:
    "I can help with tracking, but I need the order number or checkout email first so I can match the shipment to the right order.",
  humanEscalation:
    "I can pass this to human support. Please include your order number, checkout email, and a short description of the issue.",
} as const;

export function buildOrderLookupPrompt(): string {
  return RESPONSE_TEMPLATES.orderLookupPrompt;
}

export function buildShopifyNotConfiguredResponse(options: ResponseTemplateOptions = {}): string {
  return appendSupportContact(RESPONSE_TEMPLATES.shopifyNotConfigured, options);
}

export function buildLookupErrorResponse(options: ResponseTemplateOptions = {}): string {
  return appendSupportContact(RESPONSE_TEMPLATES.lookupError, options);
}

export function buildTrackingNeedsOrderResponse(options: ResponseTemplateOptions = {}): string {
  return appendSupportContact(RESPONSE_TEMPLATES.trackingNeedsOrder, options);
}

export function buildHumanEscalationResponse(options: ResponseTemplateOptions = {}): string {
  return appendSupportContact(RESPONSE_TEMPLATES.humanEscalation, options);
}

export function buildOrderStatusResponse(result: OrderStatusLookupResult, options: ResponseTemplateOptions = {}): string {
  if (!result.found) {
    return appendSupportContact(RESPONSE_TEMPLATES.orderNotFound, options);
  }

  return result.orders.map((order) => buildSingleOrderStatusResponse(order)).join("\n\n");
}

export function buildSingleOrderStatusResponse(order: OrderStatus): string {
  const lines = [
    `I found order ${order.name}.`,
    `Payment status: ${formatStatus(order.displayFinancialStatus)}`,
    `Fulfillment status: ${formatStatus(order.displayFulfillmentStatus)}`,
  ];

  if (order.totalPrice) {
    lines.push(`Order total: ${order.totalPrice.amount} ${order.totalPrice.currencyCode}`);
  }

  const trackingLines = buildTrackingLines(order.fulfillments.flatMap((fulfillment) => fulfillment.trackingInfo));
  if (trackingLines.length > 0) {
    lines.push("Tracking details:", ...trackingLines);
  } else if (order.displayFulfillmentStatus !== "FULFILLED") {
    lines.push("Tracking details are not available yet.");
  }

  if (order.cancelledAt) {
    lines.push("This order is marked as cancelled.");
  }

  return lines.join("\n");
}

function appendSupportContact(message: string, options: ResponseTemplateOptions): string {
  return options.supportEmail ? `${message}\n\nFor urgent help, contact ${options.supportEmail}.` : message;
}

function buildTrackingLines(trackingInfo: TrackingInfo[]): string[] {
  return trackingInfo
    .filter((item) => item.number || item.url)
    .map((item) => {
      const label = [item.company, item.number].filter(Boolean).join(" ");
      return `- ${label || "Tracking link"}${item.url ? `: ${item.url}` : ""}`;
    });
}

function formatStatus(status: string | null | undefined): string {
  return status ? status.toLowerCase().replace(/_/g, " ") : "unknown";
}
