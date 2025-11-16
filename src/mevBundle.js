import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';
import { ethers } from 'ethers';

// Sends signed tx bundle to a flashbots-style relay and returns result meta
export async function sendPrivateBundle(signedTxObj, provider, expectedProfit){
  // signedTxObj: { signed, txRequest, signer, estimatedGasWei }
  const relay = process.env.FLASHBOTS_RELAY || 'https://relay.flashbots.net';
  const authWallet = ethers.Wallet.createRandom();

  const fbProvider = await FlashbotsBundleProvider.create(provider, authWallet, relay);

  const bundle = [ { signedTransaction: signedTxObj.signed } ];

  const blockNumber = await provider.getBlockNumber();
  const targetBlock = Number(blockNumber + 1n);

  // Basic check: ensure expectedProfit (BigInt or Decimal-like) greater than gas cost
  try{
    const gasCost = signedTxObj.estimatedGasWei ? BigInt(signedTxObj.estimatedGasWei) : 0n;
    const profitBI = typeof expectedProfit === 'bigint' ? expectedProfit : (expectedProfit ? BigInt(expectedProfit.toString()) : 0n);
    if(profitBI <= gasCost){
      console.warn('Profit less than or equal to gas cost; aborting bundle send');
      return { success: false, reason: 'insufficient_profit' };
    }
  }catch(e){ /* ignore */ }

  const res = await fbProvider.sendBundle(bundle, targetBlock);
  const wait = await res.wait();

  if(wait && (wait === 'included' || wait.bundleHash)){
    return { success: true, bundleHash: wait.bundleHash || null };
  }
  return { success: false, info: wait };
}
