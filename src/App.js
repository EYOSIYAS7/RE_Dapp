import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Components
import Navigation from "./components/Navigation";
import Search from "./components/Search";
import HomeComponent from "./components/HomeComponent";

// ABIs
import RealEstate from "./abis/RealEstate.json";
import Escrow from "./abis/Escrow.json";

// Config
import config from "./config.json";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [homes, setHomes] = useState([]);
  const [Home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);
  const loadBlockChainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();
    console.log("The network is :", network);
    const realEstateContract = new ethers.Contract(
      config[network.chainId].realEstate.address,
      RealEstate,
      provider
    );
    const totalEstate = await realEstateContract.totalSupply();
    console.log(totalEstate.toString());
    const EscrowContract = new ethers.Contract(
      config[network.chainId].escrow.address,
      Escrow,
      provider
    );
    setEscrow(EscrowContract);

    const home = [];

    for (let index = 1; index <= totalEstate; index++) {
      const uri = await realEstateContract.tokenURI(index);
      const response = await fetch(uri);
      const metadata = await response.json();
      home.push(metadata);
      console.log("uris: ", uri);
    }
    setHomes(home);

    window.ethereum.on("accountsChanged", async () => {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = await ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
  };

  const toggleHandler = (_home) => {
    setHome(_home);
    toggle ? setToggle(false) : setToggle(true);
  };

  useEffect(() => {
    loadBlockChainData();
  }, []);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />
      <div className="cards__section">
        <h3>Homes For YOU</h3>
        <hr />
        <div className="cards">
          {homes.map((home, index) => (
            <div
              className="card"
              key={index}
              onClick={() => toggleHandler(home)}
            >
              <div className="card__image">
                <img src={home.image} alt="Home" />
              </div>
              <div className="card__info">
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {toggle && (
        <HomeComponent
          home={Home}
          account={account}
          escrow={escrow}
          provider={provider}
          toggleHandler={toggleHandler}
        />
      )}
    </div>
  );
}

export default App;
