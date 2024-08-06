import { ethers } from "ethers";
import { useEffect, useState } from "react";

import close from "../assets/close.svg";

const HomeComponent = ({ home, account, escrow, provider, toggleHandler }) => {
  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const [lender, setLender] = useState(null);
  const [inspector, setInspector] = useState(null);

  const [hasBought, setHasBought] = useState(false);
  const [hasSold, setHasSell] = useState(false);
  const [hasLended, setHasLended] = useState(false);
  const [hasinspect, setHasinspect] = useState(false);
  const [owner, setOwner] = useState(null);

  const FetchAccounts = async () => {
    const Inspector = await escrow.inspector();
    setInspector(Inspector);
    const HasInspected = await escrow.inspectionStatus(home.id);
    setHasinspect(HasInspected);
    const Lenders = await escrow.lender();
    setLender(Lenders);

    const HasLended = await escrow.approval(home.id, Lenders);
    setHasBought(HasLended);
    const Seller = await escrow.seller();
    setSeller(Seller);

    const HasSold = await escrow.approval(home.id, Seller);
    setHasSell(HasSold);
    const Buyer = await escrow.buyer(home.id);
    setBuyer(Buyer);

    const HasBought = await escrow.approval(home.id, buyer);
    setHasBought(HasBought);

    console.log("lender account", lender);
  };

  const fetchOwner = async () => {
    if (await escrow.isListed(home.id)) return;

    const owner = await escrow.buyer(home.id);
    setOwner(owner);
  };

  const buyHandler = async () => {
    const signer = await provider.getSigner();
    console.log("current buyer", signer);
    const _escrowAmount = await escrow.escrowAmount(home.id);
    console.log(_escrowAmount);
    // ethers.utils.formatEther(balance);
    console.log("home id is", home.id);
    // buyer deposit earnest money into the escrow contract
    let transaction = await escrow
      .connect(signer)
      .depositeEarnest(home.id, { value: _escrowAmount });

    await transaction.wait();

    // buyer approves

    transaction = await escrow.connect(signer).updateApprovalSatuts(home.id);
    await transaction.wait();

    setHasBought(true);
  };
  const inspectHandler = async () => {
    const signer = await provider.getSigner();
    let transaction = await escrow
      .connect(signer)
      .updateInspectionSatuts(home.id);
    await transaction.wait();

    setHasinspect(true);
  };

  const lendHandler = async () => {
    const signer = await provider.getSigner();

    let transaction = await escrow
      .connect(signer)
      .updateApprovalSatuts(home.id);
    await transaction.wait();

    const lendAmount =
      (await escrow.purchasePrice(home.id)) -
      (await escrow.escrowAmount(home.id));
    await signer.sendTransaction({
      to: escrow.address,
      value: lendAmount.toString(),
      gasLimit: 60000,
    });

    setHasLended(true);
  };
  const sellHandler = async () => {
    const signer = await provider.getSigner();

    let transaction = await escrow
      .connect(signer)
      .updateApprovalSatuts(home.id);
    await transaction.wait();

    transaction = await escrow.connect(signer).FinalizeSale(home.id);
    await transaction.wait();
    setHasSell(true);
  };

  useEffect(() => {
    FetchAccounts();
    fetchOwner();
  }, [hasSold]);
  // useEffect(() => {
  //   fetchOwner();
  // }, [hasSold]);

  return (
    <div className="home">
      {console.log("current connected account", account)}
      {console.log("current owner", owner)}
      {console.log("inspector address", inspector)}
      {console.log("lender address", lender)}
      {console.log("buyer address", buyer)}
      {console.log("seller address", seller)}
      <div className="home__details">
        <div className="home__image">
          <img src={home.image} alt="HomeImage" />
        </div>

        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> bds |
            <strong>{home.attributes[3].value}</strong> ba |
            <strong>{home.attributes[4].value}</strong> sqft
          </p>
          <p>{home.address}</p>

          <h2>{home.attributes[0].value} ETH</h2>
          <hr />

          {owner ? (
            <div className="home__owned">
              Owned by {owner.slice(0, 6) + "..." + owner.slice(38, 42)}
            </div>
          ) : (
            <div>
              {account === inspector ? (
                <div>
                  <button
                    className="home__buy"
                    onClick={inspectHandler}
                    disabled={hasinspect}
                  >
                    Approve Inspection
                  </button>
                </div>
              ) : account === seller ? (
                <div>
                  <button
                    className="home__buy"
                    onClick={sellHandler}
                    disabled={hasSold}
                  >
                    Approve And sell
                  </button>
                </div>
              ) : account === lender ? (
                <div>
                  <button
                    className="home__buy"
                    onClick={lendHandler}
                    disabled={hasLended}
                  >
                    Approve And lend
                  </button>
                </div>
              ) : (
                <button
                  className="home__buy"
                  onClick={buyHandler}
                  disabled={hasBought}
                >
                  Buy
                </button>
              )}
              <button className="home__contact">Contact agent</button>
              <hr />
            </div>
          )}

          <h2>Overview</h2>

          <p>{home.description}</p>

          <hr />

          <h2>Facts and features</h2>

          <ul>
            {home.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong> : {attribute.value}
              </li>
            ))}
          </ul>
        </div>

        <button className="home__close" onClick={toggleHandler}>
          <img src={close} alt="closeButton" />
        </button>
      </div>
    </div>
  );
};

export default HomeComponent;
