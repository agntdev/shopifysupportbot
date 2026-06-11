import assert from "node:assert/strict";
import test from "node:test";
import { parseCustomerMessage } from "../../src/routing/index.js";

test("routes order number messages to order lookup", () => {
  const parsed = parseCustomerMessage("Can you check order #1001?");

  assert.equal(parsed.type, "order_status");
  assert.equal(parsed.route, "order_lookup");
  assert.equal(parsed.lookupInput?.orderName, "#1001");
});

test("routes checkout email to order lookup", () => {
  const parsed = parseCustomerMessage("buyer@example.com");

  assert.equal(parsed.route, "order_lookup");
  assert.equal(parsed.lookupInput?.email, "buyer@example.com");
});

test("routes tracking-only messages to tracking guidance", () => {
  const parsed = parseCustomerMessage("My tracking is 1Z999AA10123456784");

  assert.equal(parsed.type, "tracking");
  assert.equal(parsed.route, "tracking_lookup");
  assert.equal(parsed.trackingNumber, "1Z999AA10123456784");
});

test("routes human support requests to escalation", () => {
  const parsed = parseCustomerMessage("I need to speak to a human about a refund");

  assert.equal(parsed.type, "human_support");
  assert.equal(parsed.route, "human_escalation");
});

test("routes vague order status questions to prompt for identifiers", () => {
  const parsed = parseCustomerMessage("Where is my order?");

  assert.equal(parsed.type, "order_status");
  assert.equal(parsed.route, "order_prompt");
});
