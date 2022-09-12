// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Uni-directional payment channel
/// @notice Uni-directional payment channel to transfer ether using other's signature.

contract UniPayment is ReentrancyGuard {
    using ECDSA for bytes32;
    
    /// @notice sender address
    address payable public senderAddress;

    /// @notice receiver address
    address payable public receiverAddress;
    
    /// @dev locked period
    uint private constant ONE_DAY = 7 * 24 * 60 * 60;

    /// @notice fund release timestamp
    uint public expiresTime;

    constructor (address _receiver) payable {
        require(_receiver != address(0), "Receiver should not be zero address.");
        senderAddress = payable(msg.sender);
        receiverAddress = payable(_receiver);
        expiresTime = block.timestamp + ONE_DAY;
    }

    /// @dev return the hash using address and amount
    function _getHash(uint _amount) private view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), _amount));    
    }

    /// @dev public functions to return the hash using address and amount
    function getHash(uint _amount) external view returns (bytes32) {
        return _getHash(_amount);
    }

    /// @dev return the eth signed message hash using address and amount
    function _getEthSignedHash(uint _amount) private view returns (bytes32) {
        return _getHash(_amount).toEthSignedMessageHash();
    }

    /// @dev public functions to return the eth signed message hash using address and amount
    function getEthSignedHash(uint _amount) external view returns (bytes32) {
        return _getEthSignedHash(_amount);
    }

    /// @dev verify the signature if it is generated using sender's address
    function _verify(uint _amount, bytes memory _signature) private view returns (bool) {
        return _getEthSignedHash(_amount).recover(_signature) == senderAddress;
    }

    /// @dev public function to verify the signature if it is generated using sender's address
    function verify(uint _amount, bytes memory _signature) external view returns(bool) {
         return _verify(_amount, _signature);
    }

    /// @dev send transaction from recevier side
    /// @dev After transaction, the balance of contract will be refunded to seller.
    function execute(uint _amount, bytes memory _signature) external nonReentrant {
        require(msg.sender == receiverAddress, "Receiver is not correct");
        require(_verify(_amount, _signature), "Invalid Signature!");
        (bool sent,) = receiverAddress.call{value: _amount}("");
        require(sent, "Tx is failed");

        selfdestruct(senderAddress);
    }

    /// @dev cancel transaction from sender side
    /// @dev The balance of contract will be refunded to seller.
    function cancel() external {
        require(msg.sender == senderAddress, "Send is not valid");
        require(block.timestamp >= expiresTime, "ExpireTime is not over.");

        selfdestruct(senderAddress);
    }
}