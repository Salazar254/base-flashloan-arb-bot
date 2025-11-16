import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const ABI_PATH = path.join(process.cwd(), 'src', 'abis', 'aavePool.json');
let aaveAbi = null;
try{ aaveAbi = JSON.parse(fs.readFileSync(ABI_PATH)); }catch(e){ aaveAbi = [] }

export async function executeFlashloan(opportunity){
  // Build the transaction to call your deployed flashloan receiver contract.
  const rpc = process.env.BASE_RPC_PRIVATE || process.env.BASE_RPC_PUBLIC;
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const flashContractAddr = process.env.CONTRACT_ADDRESS;
  if(!flashContractAddr) throw new Error('CONTRACT_ADDRESS not configured in .env');

  const iface = new ethers.Interface(["function initFlashloan(address token, uint256 amount, bytes params) payable"]);
  const params = opportunity.params || '0x';
  const data = iface.encodeFunctionData('initFlashloan', [opportunity.token, opportunity.amount.toString(), params]);

  const txRequest = {
    to: flashContractAddr,
    data,
    gasLimit: BigInt(process.env.GAS_LIMIT || 1000000)
  };

  // Estimate gas using provider
  try{
    const estimated = await provider.estimateGas({to: txRequest.to, data: txRequest.data});
    txRequest.gasLimit = BigInt(estimated.toString()) + 10000n;
  }catch(e){ /* fallback keep configured gasLimit */ }

  // Get gas price (legacy / base fee handling depends on network) — ethers v6 returns BigInt
  let gasPrice = null;
  try{ gasPrice = await provider.getGasPrice(); txRequest.gasPrice = gasPrice; }catch(e){ /* ignore */ }

  // Sign transaction but do NOT broadcast directly — return signed transaction for private bundle
  const signed = await wallet.signTransaction(txRequest);

  // Estimate gas cost in wei (approx)
  const gasCostWei = (txRequest.gasPrice ?? 0n) * (txRequest.gasLimit ?? 0n);

  return {signed, txRequest, signer: wallet.address, estimatedGasWei: gasCostWei.toString()};
}
