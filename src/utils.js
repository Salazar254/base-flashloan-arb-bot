import fs from 'fs';
import path from 'path';
import Decimal from 'decimal.js';

export function calculateProfit(opportunity){
  // opportunity should include estimatedInWeiOut and estimatedInWeiIn and estimatedGas
  // Return Decimal profit (wei)
  try{
    const out = new Decimal(opportunity.estimatedOutWei || '0');
    const inAmt = new Decimal(opportunity.estimatedInWei || '0');
    const gross = out.minus(inAmt);
    const gas = new Decimal(opportunity.estimatedGasWei || '0');
    return gross.minus(gas);
  }catch(e){
    return new Decimal(0);
  }
}

export async function logSuccess({opp, profit, txHash}){
  const log = {
    time: new Date().toISOString(),
    opportunity: opp.description || opp,
    profit: profit.toString(),
    tx: txHash
  };
  const file = path.join(process.cwd(), 'trades.log');
  fs.appendFileSync(file, JSON.stringify(log) + '\n');
  console.log('Trade logged:', log);
}

export function autoRetryOnFailure(fn, tries = 3, delayMs = 2000){
  return async function(...args){
    let lastErr = null;
    for(let i=0;i<tries;i++){
      try{ return await fn(...args); }catch(e){ lastErr = e; console.warn('Retry failed attempt', i+1, e); await new Promise(r=>setTimeout(r, delayMs)); }
    }
    throw lastErr;
  }
}

export async function estimateGasCostWei(provider, gasLimit){
  try{
    const feeData = await provider.getFeeData();
    // Prefer maxFeePerGas if available (EIP-1559), else gasPrice
    const maxFee = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
    const gas = BigInt(gasLimit ?? 21000);
    return maxFee * gas;
  }catch(e){
    return 0n;
  }
}
