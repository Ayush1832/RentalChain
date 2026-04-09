import { ethers, network } from 'hardhat';
import fs from 'fs';
import path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts on network: ${network.name}`);
  console.log(`Deployer address: ${deployer.address}`);
  console.log(
    `Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`
  );

  // Deploy IdentityRegistry
  console.log('\n[1/2] Deploying IdentityRegistry...');
  const IdentityRegistry = await ethers.getContractFactory('IdentityRegistry');
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  console.log(`IdentityRegistry deployed at: ${identityRegistryAddress}`);

  // Deploy RentalRegistry
  console.log('\n[2/2] Deploying RentalRegistry...');
  const RentalRegistry = await ethers.getContractFactory('RentalRegistry');
  const rentalRegistry = await RentalRegistry.deploy();
  await rentalRegistry.waitForDeployment();
  const rentalRegistryAddress = await rentalRegistry.getAddress();
  console.log(`RentalRegistry deployed at: ${rentalRegistryAddress}`);

  // Save deployment addresses
  const deployments = {
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      IdentityRegistry: identityRegistryAddress,
      RentalRegistry: rentalRegistryAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(filename, JSON.stringify(deployments, null, 2));
  console.log(`\nDeployment info saved to: deployments/${network.name}.json`);

  console.log('\n--- Deployment Summary ---');
  console.log(`IdentityRegistry : ${identityRegistryAddress}`);
  console.log(`RentalRegistry   : ${rentalRegistryAddress}`);
  console.log('--------------------------');

  if (network.name === 'sepolia') {
    console.log('\nVerify contracts on Etherscan:');
    console.log(
      `npx hardhat verify --network sepolia ${identityRegistryAddress}`
    );
    console.log(
      `npx hardhat verify --network sepolia ${rentalRegistryAddress}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
