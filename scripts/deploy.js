import dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

async function main(){
  const rpc = process.env.BASE_RPC_PUBLIC;
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log('This script only outputs a placeholder. Use Hardhat/Foundry for real deploys.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
