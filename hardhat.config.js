import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

<<<<<<< HEAD
import '@nomicfoundation/hardhat-ethers';
=======
import '@nomicfoundation/hardhat-ethers';   // switched to Hardhat 3 plugin
>>>>>>> 99b3761 (Switch to Hardhat 3, ethers 6, remove flashbots bundle)

import { defineConfig } from 'hardhat/config';

export default defineConfig({
  solidity: {
    compilers: [{ version: '0.8.19' }]
  },
  networks: {
    base: {
      url: process.env.BASE_RPC_PUBLIC || 'https://mainnet.base.org',
      chainId: 8453,
      type: "http"
    }
  }
});
