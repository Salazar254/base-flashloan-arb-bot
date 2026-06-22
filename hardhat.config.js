import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

import '@nomicfoundation/hardhat-ethers';

import { defineConfig } from 'hardhat/config';

export default defineConfig({
  solidity: {
    compilers: [{ version: '0.8.19' }]
  },
  plugins: ['@nomicfoundation/hardhat-ethers'],
  paths: {
    sources: './src/contracts',
    tests: './src/test',
    cache: './cache',
    artifacts: './artifacts'
  },
  networks: {
    base: {
      url: process.env.BASE_RPC_PUBLIC || 'https://mainnet.base.org',
      chainId: 8453,
      type: "http"
    }
  }
});
