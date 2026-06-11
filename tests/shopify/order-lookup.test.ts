import assert from "node:assert/strict";
import test from "node:test";
import { buildOrderSearchQuery, formatOrderStatusResult, parseOrderLookupText } from "../../src/shopify/index.js";

test("parseOrderLookupText extracts order number and email", () => {
  assert.deepEqual(parseOrderLookupText("Can you check #1001 for buyer@example.com?"), {
    orderName: "#1001",
    email: "buyer@example.com",
  });
});

test("buildOrderSearchQuery quotes Shopify search values", () => {
  assert.equal(buildOrderSearchQuery({ orderName: "#1001", email: "BUYER@EXAMPLE.COM" }), 'name:"1001" AND email:"buyer@example.com"');
});

test("formatOrderStatusResult formats payment, fulfillment, and tracking", () => {
  const message = formatOrderStatusResult({
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

  assert.match(message, /Order #1001/);
  assert.match(message, /Payment: paid/);
  assert.match(message, /Fulfillment: fulfilled/);
  assert.match(message, /UPS 1Z999/);
});
