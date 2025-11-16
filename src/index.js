import { startBot } from "./bot.js";

async function main() {
    const { provider, wallet, flashbotsProvider } = await startBot();

    console.log("Bot is ready to execute real flashloan arbitrage trades...");

    // Example placeholder: Replace with your real flashloan + arbitrage logic
    // await executeFlashloanArbitrage(provider, wallet, flashbotsProvider);
}

main();
