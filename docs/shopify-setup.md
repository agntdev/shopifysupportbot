# Shopify API Setup

ShopifySupportBot uses the Shopify Admin API to read order and fulfillment data. Credentials must be stored as runtime secrets, not committed to git.

## Required Runtime Variables

```text
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
SHOPIFY_API_VERSION=2026-04
```

`SHOPIFY_SHOP_DOMAIN` must be the store's `myshopify.com` domain because that is the Admin API host. Do not use the public storefront domain.

## Required Admin API Scopes

Configure the Shopify app with these authenticated Admin API scopes:

```text
read_orders
read_fulfillments
```

Optional scope:

```text
read_all_orders
```

`read_all_orders` is only needed if the bot must retrieve orders outside Shopify's default order access window. It may require extra approval in Shopify.

## App Creation Checklist

1. Create or open the Shopify app for the target store.
2. Configure Admin API access scopes: `read_orders` and `read_fulfillments`.
3. Install or re-authorize the app on the store.
4. Copy the Admin API access token into the runtime secret store as `SHOPIFY_ADMIN_ACCESS_TOKEN`.
5. Set `SHOPIFY_SHOP_DOMAIN` to the store's `myshopify.com` domain.
6. Set `SHOPIFY_API_VERSION=2026-04`.
7. Restart the bot so it reads the new environment.

## Verification Request

Use this token-safe command locally. It prints only the store identity returned by Shopify.

```bash
curl -sS -X POST "https://$SHOPIFY_SHOP_DOMAIN/admin/api/$SHOPIFY_API_VERSION/graphql.json" \
  -H "X-Shopify-Access-Token: $SHOPIFY_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ shop { name myshopifyDomain } }"}'
```

References:

- Shopify API versioning: https://shopify.dev/docs/api/usage/versioning
- Shopify API access scopes: https://shopify.dev/docs/api/usage/access-scopes
