// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const tokens = (n) => {
    // check if it is a big number or not??
    return ethers.utils.parseUnits(n.toString(), "ether");
  };
  [buyer, seller, inspector, lender] = await ethers.getSigners();
  // console.log(seller, buyer, lender, inspector);

  const RealEstate = await ethers.getContractFactory("RealEstateNFT");
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();

  console.log(`Deployed real estate contract at ${realEstate.address}`);
  console.log("Minting 3 properties");

  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate
      .connect(seller)
      .mint(
        `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${
          i + 1
        }.json`
      );
    await transaction.wait();
  }
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.address,
    seller.address,
    lender.address,
    inspector.address
  );
  await escrow.deployed();

  console.log(`Deployed Escrow Contract at: ${escrow.address}`);
  console.log(`Listing 3 properties...\n`);

  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate
      .connect(seller)
      .approve(escrow.address, i + 1);
    await transaction.wait();
  }
  console.log("approve finished");
  transaction = await escrow
    .connect(seller)
    .ListProperty(1, tokens(20), tokens(10), buyer.address);
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .ListProperty(2, tokens(15), tokens(5), buyer.address);
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .ListProperty(3, tokens(10), tokens(5), buyer.address);
  await transaction.wait();

  console.log(`Finished.`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
