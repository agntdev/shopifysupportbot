import { parseOrderLookupText, type OrderLookupInput } from "../shopify/index.js";

export type InquiryType = "order_status" | "tracking" | "human_support" | "help" | "greeting" | "unknown";

export type MessageRoute = "order_lookup" | "tracking_lookup" | "human_escalation" | "help" | "order_prompt";

export interface ParsedCustomerMessage {
  type: InquiryType;
  route: MessageRoute;
  lookupInput?: OrderLookupInput;
  trackingNumber?: string;
  originalText: string;
}

const HUMAN_SUPPORT_PATTERN = /\b(human|agent|representative|person|support team|speak to|talk to|escalate|complaint|refund|cancel|damaged|wrong item)\b/i;
const HELP_PATTERN = /\b(help|what can you do|commands|options)\b/i;
const GREETING_PATTERN = /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i;
const TRACKING_PATTERN = /\b([A-Z]{1,4}\d[A-Z0-9-]{7,}|1Z[A-Z0-9]{16})\b/i;
const ORDER_STATUS_PATTERN = /\b(order|status|where is|delivery|delivered|shipping|shipped|fulfillment|purchase)\b/i;

export function parseCustomerMessage(text: string): ParsedCustomerMessage {
  const trimmed = text.trim();
  const lookupInput = parseOrderLookupText(trimmed) ?? undefined;
  const trackingNumber = extractTrackingNumber(trimmed);
  const hasExplicitOrderLookup = Boolean(lookupInput?.email || hasExplicitOrderName(trimmed, lookupInput?.orderName));

  if (HUMAN_SUPPORT_PATTERN.test(trimmed)) {
    return {
      type: "human_support",
      route: "human_escalation",
      lookupInput,
      trackingNumber,
      originalText: text,
    };
  }

  if (HELP_PATTERN.test(trimmed)) {
    return {
      type: "help",
      route: "help",
      lookupInput,
      trackingNumber,
      originalText: text,
    };
  }

  if (trackingNumber) {
    return {
      type: "tracking",
      route: hasExplicitOrderLookup ? "order_lookup" : "tracking_lookup",
      lookupInput: hasExplicitOrderLookup ? lookupInput : undefined,
      trackingNumber,
      originalText: text,
    };
  }

  if (hasExplicitOrderLookup || ORDER_STATUS_PATTERN.test(trimmed)) {
    return {
      type: "order_status",
      route: hasExplicitOrderLookup ? "order_lookup" : "order_prompt",
      lookupInput: hasExplicitOrderLookup ? lookupInput : undefined,
      originalText: text,
    };
  }

  if (GREETING_PATTERN.test(trimmed)) {
    return {
      type: "greeting",
      route: "order_prompt",
      originalText: text,
    };
  }

  return {
    type: "unknown",
    route: "order_prompt",
    originalText: text,
  };
}

function extractTrackingNumber(text: string): string | undefined {
  return text.match(TRACKING_PATTERN)?.[1]?.toUpperCase();
}

function hasExplicitOrderName(text: string, orderName: string | undefined): boolean {
  if (!orderName) {
    return false;
  }

  const numericOrder = orderName.replace(/^#/, "");
  return text.includes(`#${numericOrder}`) || new RegExp(`\\border\\s*#?${escapeRegExp(numericOrder)}\\b`, "i").test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
