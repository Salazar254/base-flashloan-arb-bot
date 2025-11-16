import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const abisDir = path.join(process.cwd(), 'src', 'abis');
const sushiswapAbi = JSON.parse(fs.readFileSync(path.join(abisDir, 'sushiswap.json')));
const aerodromeAbi = JSON.parse(fs.readFileSync(path.join(abisDir, 'aerodrome.json')));
let quoterAbi = null;
try{ quoterAbi = JSON.parse(fs.readFileSync(path.join(abisDir, 'uniswapV3quoter.json'))); }catch(e){ quoterAbi = null }

// Helper to query getAmountsOut on UniswapV2-like routers
async function getAmountsOut(routerAddr, amountIn, pathArr, provider, abi){
  try{
    const contract = new ethers.Contract(routerAddr, abi, provider);
    const out = await contract.getAmountsOut(amountIn.toString(), pathArr);
    return out.map(x=>BigInt(x.toString()));
  }catch(e){
    return null;
  }
}

// Helper for Uniswap V3 quoterExactInputSingle style. We'll try common fee tiers and pick best.
async function quoteUniswapV3(quoterAddr, tokenIn, tokenOut, amountIn, provider){
  if(!quoterAddr || !quoterAddr.startsWith('0x') || !quoterAbi) return null;
  try{
    const quoter = new ethers.Contract(quoterAddr, quoterAbi, provider);
    const feeTiers = [500, 3000, 10000];
    let best = null;
    for(const fee of feeTiers){
      try{
        const amountOut = await quoter.quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn.toString(), 0);
        const outBI = BigInt(amountOut.toString());
        if(!best || outBI > best.amountOut) best = { fee, amountOut: outBI };
      }catch(e){ /* ignore per-fee failures */ }
    }
    return best;
  }catch(e){
    return null;
  }
}

function applySlippage(amountWeiStr){
  const slippageBps = process.env.SLIPPAGE_BPS ? Number(process.env.SLIPPAGE_BPS) : 50; // 0.5% default
  const amount = BigInt(amountWeiStr);
  const adjusted = (amount * BigInt(10000 - slippageBps)) / 10000n;
  return adjusted;
}

export async function fetchPriceDifferences(provider){
  const tokenA = process.env.TOKEN_A;
  const tokenB = process.env.TOKEN_B;
  const tokenC = process.env.TOKEN_C;
  const amount = process.env.FLASHLOAN_AMOUNT ? BigInt(process.env.FLASHLOAN_AMOUNT) : 0n;

  const sRouter = process.env.SUSHISWAP_ROUTER;
  const aRouter = process.env.AERODROME_ROUTER;
  const uniQuoter = process.env.UNISWAP_V3_QUOTER;

  const opportunities = [];
  if(!tokenA || !tokenB || amount === 0n) return opportunities;

  // A -> B on Sushiswap then B -> A on Aerodrome
  if(sRouter && aRouter){
    const out1 = await getAmountsOut(sRouter, amount, [tokenA, tokenB], provider, sushiswapAbi);
    if(out1 && out1.length){
      const amountAfterFirst = out1[out1.length-1];
      const amountAfterFirstAdj = applySlippage(amountAfterFirst.toString());
      const out2 = await getAmountsOut(aRouter, amountAfterFirstAdj, [tokenB, tokenA], provider, aerodromeAbi);
      if(out2 && out2.length){
        const finalAmount = out2[out2.length-1];
        const profit = BigInt(finalAmount) - BigInt(amount);
        if(profit > 0n){
          opportunities.push({
            description: `Sushi:${tokenA}->${tokenB} then Aerodrome:${tokenB}->${tokenA}`,
            token: tokenA,
            amount,
            estimatedInWei: amount.toString(),
            estimatedOutWei: finalAmount.toString(),
            estimatedGasWei: process.env.GAS_LIMIT ? (BigInt(process.env.GAS_LIMIT) * 1000000000n).toString() : '0',
            params: '0x',
            route: {first: {router: sRouter, path: [tokenA, tokenB]}, second: {router: aRouter, path: [tokenB, tokenA]}}
          });
        }
      }
    }
  }

  // Try Uniswap V3 Quoter for single-hop A->B and B->A
  if(uniQuoter){
    try{
      const q1 = await quoteUniswapV3(uniQuoter, tokenA, tokenB, amount, provider);
      if(q1){
        const amountAfter = q1.amountOut;
        const amountAfterAdj = applySlippage(amountAfter.toString());
        // Try route back on Sushiswap
        if(sRouter){
          const back = await getAmountsOut(sRouter, amountAfterAdj, [tokenB, tokenA], provider, sushiswapAbi);
          if(back && back.length){
            const final = back[back.length-1];
            if(BigInt(final) > amount){
              opportunities.push({
                description: `UniswapV3(${q1.fee}) ${tokenA}->${tokenB} then Sushi ${tokenB}->${tokenA}`,
                token: tokenA,
                amount,
                estimatedInWei: amount.toString(),
                estimatedOutWei: final.toString(),
                estimatedGasWei: process.env.GAS_LIMIT ? (BigInt(process.env.GAS_LIMIT) * 1000000000n).toString() : '0',
                params: '0x',
                route: {first:{quoter: uniQuoter, fee: q1.fee}, second:{router: sRouter}}
              });
            }
          }
        }
      }
    }catch(e){ /* ignore */ }
  }

  // Optional triangular A->B->C->A
  if(tokenC && sRouter && aRouter){
    const outAB = await getAmountsOut(sRouter, amount, [tokenA, tokenB], provider, sushiswapAbi);
    if(outAB && outAB.length){
      const outBC = await getAmountsOut(aRouter, applySlippage(outAB[outAB.length-1].toString()), [tokenB, tokenC], provider, aerodromeAbi);
      if(outBC && outBC.length){
        const outCA = await getAmountsOut(sRouter, applySlippage(outBC[outBC.length-1].toString()), [tokenC, tokenA], provider, sushiswapAbi);
        if(outCA && outCA.length){
          const final = outCA[outCA.length-1];
          if(BigInt(final) > amount){
            opportunities.push({
              description: `Triangular ${tokenA}->${tokenB}->${tokenC}->${tokenA}`,
              token: tokenA,
              amount,
              estimatedInWei: amount.toString(),
              estimatedOutWei: final.toString(),
              estimatedGasWei: process.env.GAS_LIMIT ? (BigInt(process.env.GAS_LIMIT) * 1000000000n).toString() : '0',
              params: '0x',
              route: {steps: [[tokenA, tokenB], [tokenB, tokenC], [tokenC, tokenA]]}
            });
          }
        }
      }
    }
  }

  return opportunities;
}

export async function monitorDEXs(provider, cb){
  while(true){
    try{
      const opps = await fetchPriceDifferences(provider);
      for(const o of opps) await cb(o);
    }catch(e){ console.error('monitorDEXs error', e); }
    await new Promise(r=>setTimeout(r, 5000));
  }
}
