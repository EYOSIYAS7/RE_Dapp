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
    address payable public seller;
    address public lender;
    address public inspector;
    // because we need to sepcify for a specific nft
    mapping (uint256 => bool) public isListed;
    mapping (uint256 => uint256) public purchasePrice;
    mapping (uint256 => uint256) public escrowAmount;
    mapping (uint256 => address) public buyer;
    constructor(address _nftAddress, address payable _seller, address _lender, address _inspector){
        nftAddress = _nftAddress;
        seller = _seller;
        lender = _lender;
        inspector = _inspector;
        
        ierc721 = IERC721(_nftAddress);

    }

    function ListProperty(uint256 _nftID, uint256 _purchasePrice, uint256 _EscrowAmont, address _buyer) public{
        // transfer the ownership to escrow address
        ierc721.transferFrom(msg.sender, address(this), _nftID);
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _EscrowAmont;
        buyer[_nftID] = _buyer;
    }

}
