# ShopifySupportBot

Telegram bot for Shopify store order support.

## Telegram Bot Setup

The agnt-managed Telegram bot identity for this project is:

```text
@shopifysupportbot_hg37nz_bot
```

The bot token must never be committed to git. Create or connect the bot through BotFather/agnt, then inject the token at runtime with `BOT_TOKEN`.

1. Copy `.env.example` to `.env`.
2. Set `BOT_TOKEN` to the Telegram bot token.
3. Keep `BOT_USERNAME=shopifysupportbot_hg37nz_bot` unless the managed bot identity changes.
4. Optionally set `SHOPIFY_SHOP_DOMAIN` and `SUPPORT_EMAIL`.

See [docs/telegram-setup.md](docs/telegram-setup.md) for the BotFather checklist and command configuration.

## Development

```bash
npm install
npm run typecheck
npm run dev
```

## Production Start

Build and run the compiled bot:

```bash
npm run build
npm start
```

The bot registers these Telegram commands on startup:

- `/start` - open the support assistant
- `/help` - show setup and usage details
- `/status` - check bot configuration status

## Notes

- `src/index.ts` exports `makeBot()` so later test-harness tasks can import a fresh bot instance without starting polling.
- `BOT_TOKEN` is required only for `npm run dev` or `npm start`; tests can instantiate `makeBot()` with a test token.
