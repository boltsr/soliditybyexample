// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract EnglishAuction {
    IERC721 public nft;
    uint public nftID;

    address payable public seller;
    uint public endTime;
    bool public started;
    bool public ended;

    address public highestBidder;
    uint public highestBid;
    mapping(address => uint) public bidInfo;

    constructor(
    address _nft,
    uint _nftId,
    uint _startingBid
    ) {
        nft = IERC721(_nft);
        nftID = _nftId;
        seller = payable(msg.sender);
        highestBid = _startingBid;
    }

    function start () external {
        require(!started, "already started");
        require(msg.sender == seller, "Caller should be a seller.");
        nft.transferFrom(msg.sender, address(this), nftID);
        endTime = block.timestamp + 7 days;
        started = true;
    }

    function bid() external payable {
        require(started, "not started");
        require(block.timestamp < endTime, "already ended");
        require(msg.value > highestBid, "should be higher");

        if (highestBidder != address(0)) {
            bidInfo[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
    }

    function end() external {
        require(started, "not started");
        require(block.timestamp >= endTime, "not ended");
        require(!ended, "ended");

        ended = true;
        if (highestBidder != address(0)) {
            nft.safeTransferFrom(address(this), highestBidder, nftID);
            seller.transfer(highestBid);
        } else {
            nft.safeTransferFrom(address(this), seller, nftID);
        }
    }

    function withdraw() external {
        uint bal = bidInfo[msg.sender];
        bidInfo[msg.sender] = 0;
        payable(msg.sender).transfer(bal);
    }
}