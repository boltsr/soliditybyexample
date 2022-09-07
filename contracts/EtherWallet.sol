// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

/// @title Ether Wallet
/// @notice Basic ETH wallet that can deposit and withdraw the ETH.
/// @dev Only owner can withdraw the fund.

contract EtherWallet {
    /// @notice Owner address
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    receive() external payable {}

    /// @dev Only owner can withdraw the fund.
    /// @param _amount ETH amount that owner withdraws.
    function withdraw(uint256 _amount) public {
        require(msg.sender == owner, "Only owner can withdraw.");
        payable(msg.sender).transfer(_amount);
    }

    /// @notice Returns the current balance of this wallet.
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
