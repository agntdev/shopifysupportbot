import assert from "node:assert/strict";
import test from "node:test";
import { ShopifyApiError, shopifyAdminGraphql } from "../../src/shopify/index.js";

const config = {
  shopDomain: "demo.myshopify.com",
  adminAccessToken: "shpat_test",
  apiVersion: "2026-04",
};

test("shopifyAdminGraphql sends Admin API auth headers", async () => {
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), "https://demo.myshopify.com/admin/api/2026-04/graphql.json");
    assert.equal((init?.headers as Record<string, string>)["X-Shopify-Access-Token"], "shpat_test");
    assert.equal(JSON.parse(String(init?.body)).variables.id, "gid://shopify/Order/1");

    return new Response(JSON.stringify({ data: { ok: true } }), { status: 200 });
  };

  const data = await shopifyAdminGraphql<{ ok: boolean }, { id: string }>(
    config,
    "query Test($id: ID!) { node(id: $id) { id } }",
    { id: "gid://shopify/Order/1" },
    fetchImpl,
  );

  assert.deepEqual(data, { ok: true });
});

test("shopifyAdminGraphql reports GraphQL errors", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ errors: [{ message: "Access denied for orders field." }] }), { status: 200 });

  await assert.rejects(
    () => shopifyAdminGraphql(config, "query { orders(first: 1) { edges { node { id } } } }", {}, fetchImpl),
    (error) => error instanceof ShopifyApiError && error.message.includes("Access denied"),
  );
});
