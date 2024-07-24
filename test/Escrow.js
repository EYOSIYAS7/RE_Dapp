const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let realEstate, escrow;
  let seller, buyer, lender, inspector;
  beforeEach(async () => {
    console.log("running beforeEach");
    // there are fake accounts that comes with hardhat
    [seller, buyer, lender, inspector] = await ethers.getSigners();

    // getting the RealEstateNFT compiled contract and then deploying the contract
    const RealEstate = await ethers.getContractFactory("RealEstateNFT");
    realEstate = await RealEstate.deploy();

    // checking the mint functionality
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );
    await transaction.wait();
    // getting th Escrow compiled contract and deploying it
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      lender.address,
      inspector.address
    );
    // Erc721 method used
    transaction = await realEstate.connect(seller).approve(escrow.address, 1);
    await transaction.wait();

    transaction = await escrow
      .connect(seller)
      .ListProperty(1, tokens(100), tokens(10), buyer.address);
    await transaction.wait();
  });
  describe("Deployment", () => {
    it("Returns the Nft address", async () => {
      const nftAdd = await escrow.nftAddress();

      expect(nftAdd).to.be.equal(realEstate.address);
    });
    it("Returns the seller address", async () => {
      const result = await escrow.seller();

      expect(result).to.be.equal(seller.address);
    });
    it("Returns the lender address", async () => {
      const result = await escrow.lender();

      expect(result).to.be.equal(lender.address);
    });
    it("Returns the inspector address", async () => {
      const result = await escrow.inspector();

      expect(result).to.be.equal(inspector.address);
    });
  });

  describe("transfer Ownership", () => {
    it("update the listing of the nft", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });
    // Erc721 method used
    it("it transfers the Nft to Escrow", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });
    it("update the purchasePrice of the nft", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(100));
    });
    it("update the escrowAmount of the nft", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(10));
    });
    // the buyer function is actually a mapping in the contract
    it("update the buyer of the nft", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    });
  });

  describe("Deposit", () => {
    it("Deposit Earnset to Escrow balance", async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositeEarnest(1, { value: tokens(10) });
      await transaction.wait();

      const result = await escrow.getBalance();

      expect(result).to.be.equal(tokens(10));
    });

    it("updates the inspection status", async () => {
      let transaction = await escrow
        .connect(inspector)
        .updateInspectionSatuts(1);
      await transaction.wait();
      const result = await escrow.inspectionStatus(1);

      expect(result).to.be.equal(true);
    });
    it("updates the approval status for each stakeholder", async () => {
      let transaction = await escrow.connect(buyer).updateApprovalSatuts(1);
      await transaction.wait();
      transaction = await escrow.connect(seller).updateApprovalSatuts(1);
      await transaction.wait();
      transaction = await escrow.connect(lender).updateApprovalSatuts(1);
      await transaction.wait();

      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  describe("sale", () => {
    it("Finalize sale", async () => {
      let transaction = await escrow
        .connect(inspector)
        .updateInspectionSatuts(1);
      await transaction.wait();
      transaction = await escrow.connect(buyer).updateApprovalSatuts(1);
      await transaction.wait();
      transaction = await escrow.connect(seller).updateApprovalSatuts(1);
      await transaction.wait();
      transaction = await escrow.connect(lender).updateApprovalSatuts(1);
      await transaction.wait();
      transaction = await escrow
        .connect(buyer)
        .depositeEarnest(1, { value: tokens(10) });
      await transaction.wait();
      // this how the lender deposits the remaining fund
      await lender.sendTransaction({ to: escrow.address, value: tokens(90) });

      transaction = await escrow.connect(seller).FinalizeSale(1);
      await transaction.wait();
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
      const result = await escrow.getBalance();

      expect(result).to.be.equal(0);
    });
  });
});
