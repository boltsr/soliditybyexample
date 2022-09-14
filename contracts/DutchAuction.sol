// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DutchAuction {
    IERC721 public nft;
    uint public nftID;

    address payable public  seller;
    uint public  startPrice;
    uint public  startTime;
    uint public  expireTime;
    uint public  discountRate;

    constructor(
        uint _startPrice,
        uint _discountRate,
        address _nft,
        uint _nftId
    ) {
        seller = payable(msg.sender);
        startPrice = _startPrice;
        startTime = block.timestamp;
        expireTime = block.timestamp + 7 days;
        discountRate = _discountRate;

        require(_startPrice >= _discountRate * 7 days, "start price should be bigger.");

        nft = IERC721(_nft);
        nftID = _nftId;
    }
    function getPrice() public view returns (uint) {
        uint timeElapsed = block.timestamp - startTime;
        uint discount = discountRate * timeElapsed;
        return startPrice - discount;
    }

    function buy() external payable {
        require(block.timestamp < expireTime, "auction ended");

        uint price = getPrice();
        nft.transferFrom(seller, msg.sender, nftID);    
        uint refund = msg.value - price;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
        selfdestruct(seller);
    }
}