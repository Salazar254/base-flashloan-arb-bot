import hre from 'hardhat';
import fs from 'fs';
import path from 'path';

async function main(){
  const FlashloanReceiver = await hre.ethers.getContractFactory('FlashloanReceiver');
  const poolAddr = process.env.AAVE_POOL_ADDRESS || process.env.AAVE_POOL || '';
  if(!poolAddr) {
    console.error('Set AAVE_POOL_ADDRESS or AAVE_POOL in .env before running this deploy script');
    process.exit(1);
  }

  const deployed = await FlashloanReceiver.deploy(poolAddr);
  await deployed.waitForDeployment();
  console.log('FlashloanReceiver deployed to', deployed.target);

  const outPath = path.join(process.cwd(), 'deployments.json');
  fs.writeFileSync(outPath, JSON.stringify({FlashloanReceiver: deployed.target}, null, 2));
}

main().catch(e=>{ console.error(e); process.exit(1); });
