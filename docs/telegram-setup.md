# Telegram Setup

This project uses the agnt-managed Telegram bot identity:

```text
@shopifysupportbot_hg37nz_bot
```

## BotFather Checklist

If a replacement bot is ever needed, create it through BotFather:

1. Open a chat with `@BotFather`.
2. Send `/newbot`.
3. Use `ShopifySupportBot` as the display name.
4. Pick an available username ending in `_bot`.
5. Copy the token into the runtime secret store as `BOT_TOKEN`.
6. Do not commit the token to git or paste it into task files.

## Recommended BotFather Configuration

Set these BotFather values for the support bot:

```text
/setdescription
Automated Shopify order support for order status, tracking updates, and common customer questions.

/setabouttext
Shopify order support assistant.

/setcommands
start - Open the Shopify support assistant
help - Show setup and usage details
status - Check bot configuration status
```

For this bot's initial use case, direct messages are enough. Keep group privacy enabled unless a later task explicitly adds group support.

## Runtime Secrets

Required:

```text
BOT_TOKEN=<telegram bot token>
```

Optional:

```text
BOT_USERNAME=shopifysupportbot_hg37nz_bot
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SUPPORT_EMAIL=support@example.com
```
