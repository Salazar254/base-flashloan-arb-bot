import dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';
import { fetchPriceDifferences } from '../src/dexRouters.js';

async function main(){
  const rpc = process.env.BASE_RPC_PUBLIC;
  if(!rpc) { console.error('.env BASE_RPC_PUBLIC not set'); process.exit(1); }
  const provider = new ethers.JsonRpcProvider(rpc);
  console.log('Running smoke test: fetchPriceDifferences');
  const opps = await fetchPriceDifferences(provider);
  console.log('Found opportunities:', opps.length);
  for(const o of opps) console.log(o.description, 'profitWei=', (BigInt(o.estimatedOutWei || '0') - BigInt(o.estimatedInWei || '0')).toString());
}

main().catch(e=>{ console.error(e); process.exit(1); });
