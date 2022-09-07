// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

/// @title Ether Wallet
/// @notice Basic ETH wallet that can deposit and withdraw the ETH.
/// 


contract EtherWallet {
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    receive() external payable {}

    function withdraw(uint256 _amount) public {
        require(msg.sender == owner, "Only owner can withdraw.");
        payable(msg.sender).transfer(_amount);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
