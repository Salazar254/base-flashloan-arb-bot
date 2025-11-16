# Base Flashloan Arbitrage Bot

This repository contains a production-oriented JavaScript flashloan arbitrage bot targeting Base mainnet using Aave V3 flashloans and private bundles (Flashbots-style).

WARNING: This software interacts with financial systems and can lose funds. Test thoroughly on testnet and review security audits before using on mainnet. Never store real private keys in source control.

Getting started

- Copy `.env.example` to `.env` and fill values.
- Install dependencies: `npm install`.
- Deploy the Solidity `FlashloanReceiver` to Base (see `scripts/deploy.js`).
-- Update `CONTRACT_ADDRESS` in `.env`.
- Start the bot: `npm start` (or use PM2 for production).

PM2 example

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs
```

Testnet and Safety

- Always test on a Base testnet or forked environment before mainnet.
- Use small flashloan amounts and verify repayment logic.
- Validate gas and profit thresholds before submitting bundles.

Files

- `src/` - JS source files (bot, flashloan caller, DEX router helpers, MEV bundle sender)
- `src/contracts/FlashloanReceiver.sol` - Solidity flashloan receiver skeleton for Aave V3
- `scripts/deploy.js` - simple deployment helper

Hardhat compile & deploy

1. Install dependencies:

```bash
npm install
```

2. Compile & deploy (example):

```bash
npx hardhat compile
npx hardhat run scripts/deploy_flashloan.js --network base
```

Smoke test (non-destructive)

```bash
node scripts/smoke.js
```

Security & next steps

- Fill `.env` with correct RPC URLs, router addresses and `PRIVATE_KEY`.
- Test on a fork or Base testnet with small amounts before mainnet.
- For production: integrate Uniswap V3 quoter, add gas-oracle checks, and audit the Solidity contract.

Dashboard

- Start the bot and dashboard together by running `npm start`. The dashboard listens on `DASHBOARD_PORT` (default `3000`).
- Point your browser to `http://<server-ip>:3000` to see live opportunities, trades, and logs.

Example to run on Ubuntu cloud (background using PM2):

```bash
# set up environment file first
npm install
pm2 start ecosystem.config.js --env production
```

Make sure your VM security group / firewall allows the dashboard port if you want remote access (or restrict it to your IP).
