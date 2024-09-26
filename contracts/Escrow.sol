//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    IERC721 ierc721;
    address public nftAddress;
    address payable public seller; //it's payable because it recives ETH 
    address public lender;
    address public inspector;
    // because we need to sepcify this property for a specific NFT by their id
    mapping (uint256 => bool) public isListed;
    mapping (uint256 => uint256) public purchasePrice;
    mapping (uint256 => uint256) public escrowAmount;
    mapping (uint256 => address) public buyer;
    mapping (uint256 => bool) public inspectionStatus;
    mapping (uint256 => mapping(address => bool)) public approval;

    constructor(address _nftAddress, address payable _seller, address _lender, address _inspector){
        nftAddress = _nftAddress;
        seller = _seller;
        lender = _lender;
        inspector = _inspector;
        
        ierc721 = IERC721(_nftAddress);
    }
    modifier onlyseller() {
        require(msg.sender == seller, "Only seller can call this function");
        _;
    }
    modifier onlyBuyer(uint256 nftID) {
        require(msg.sender == buyer[nftID], "Only buyer can call this function");
        _;
    }

    modifier onlyInspector(uint256 nftID) {
        require(msg.sender == inspector , "only inspector can call this function");
        _;
    }
    // listing the RealEstate nfts in to the Escrow contract
    function ListProperty(uint256 _nftID, uint256 _purchasePrice, uint256 _EscrowAmont, address _buyer) public payable onlyseller(){
        // the seller transfer the ownership to escrow address 
        // Erc721 method used
        ierc721.transferFrom(msg.sender, address(this), _nftID);
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _EscrowAmont;
        buyer[_nftID] = _buyer;
    }

    function depositeEarnest(uint256 _nftID) public payable {
         require(msg.sender == buyer[_nftID], "Only buyer can call this function");
        require(msg.value >=  escrowAmount[_nftID],"the deposite earnest must be greater or equalto than the escrowAmount");
    }

    receive() external payable{
    
    }

    function getBalance() public view returns(uint256){
        return address(this).balance;
    }

    function updateInspectionSatuts(uint256 _nftID) public {
        inspectionStatus[_nftID] = true;
    }
     function updateApprovalSatuts(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }

    function FinalizeSale (uint256 _nftID) public  {
        require(inspectionStatus[_nftID],"must be approved by inspecctor");
        require(approval[_nftID][seller],"must be approved by seller");
        require(approval[_nftID][buyer[_nftID]],"must be approved by buyer");
        require(approval[_nftID][lender],"must be approved by lender");
        require(address(this).balance >= purchasePrice[_nftID], "not sufficient fund");
        // transfer the fund to the seller
       (bool success, ) = payable(seller).call{value : address(this).balance}(" ");
        require(success, "Didn't transfer the fund to the seller");
        // move the ownership of the nft to the buyer
        ierc721.transferFrom(address(this),buyer[_nftID] , _nftID);

        isListed[_nftID] = false;
    }

    function cancelTransaction(uint256 _nftID) public {
        if(inspectionStatus[_nftID] == false) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        }else {
             payable(seller).transfer(address(this).balance);
        }
    } 
}
