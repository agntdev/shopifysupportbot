import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLookupErrorResponse,
  buildOrderLookupPrompt,
  buildOrderStatusResponse,
  buildShopifyNotConfiguredResponse,
} from "../../src/responses/index.js";

test("buildOrderLookupPrompt asks for useful order identifiers", () => {
  const message = buildOrderLookupPrompt();

  assert.match(message, /order number/i);
  assert.match(message, /email/i);
});

test("support contact is appended to unavailable responses", () => {
  assert.match(buildShopifyNotConfiguredResponse({ supportEmail: "help@example.com" }), /help@example\.com/);
  assert.match(buildLookupErrorResponse({ supportEmail: "help@example.com" }), /help@example\.com/);
});

test("buildOrderStatusResponse renders professional order status summary", () => {
  const message = buildOrderStatusResponse({
    found: true,
    query: 'name:"1001"',
    orders: [
      {
        id: "gid://shopify/Order/1",
        name: "#1001",
        email: "buyer@example.com",
        createdAt: "2026-06-01T10:00:00Z",
        displayFinancialStatus: "PAID",
        displayFulfillmentStatus: "FULFILLED",
        totalPrice: { amount: "42.00", currencyCode: "USD" },
        fulfillments: [
          {
            status: "SUCCESS",
            trackingInfo: [{ company: "UPS", number: "1Z999", url: "https://track.example/1Z999" }],
          },
        ],
      },
    ],
  });

  assert.match(message, /I found order #1001/);
  assert.match(message, /Payment status: paid/);
  assert.match(message, /Fulfillment status: fulfilled/);
  assert.match(message, /Tracking details:/);
});

test("buildOrderStatusResponse gives no-match guidance", () => {
  assert.match(buildOrderStatusResponse({ found: false, query: 'name:"9999"', orders: [] }), /could not find an order/i);
});
