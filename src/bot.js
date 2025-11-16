import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.BASE_RPC_PUBLIC || !process.env.BASE_RPC_PRIVATE) {
    console.error("No RPC or wallet configured. Set BASE_RPC_PUBLIC and BASE_RPC_PRIVATE in your .env");
    process.exit(1);
}

const RPC_URL = process.env.BASE_RPC_PUBLIC;
const PRIVATE_KEY = process.env.BASE_RPC_PRIVATE;

export async function startBot() {
    try {
        console.log("Starting Base flashloan arbitrage bot...");

        // Provider for Base network
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

        // Wallet
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        // Flashbots provider
        const flashbotsProvider = await FlashbotsBundleProvider.create(provider, wallet);

        console.log("Bot initialized successfully.");

        return { provider, wallet, flashbotsProvider };
    } catch (error) {
        console.error("Fatal error in bot:", error);
        process.exit(1);
    }
}
