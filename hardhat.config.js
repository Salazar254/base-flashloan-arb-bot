import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

import '@nomicfoundation/hardhat-ethers';

export default {
  solidity: {
    compilers: [{ version: '0.8.19' }]
  },
  networks: {
    base: {
      url: process.env.BASE_RPC_PUBLIC || 'https://mainnet.base.org',
      chainId: 8453
    }
  }
};
