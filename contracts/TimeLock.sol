// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
/// @title TimeLock
/// @notice Public transactions to be executed in the future.
/// @dev Only owner can cancel the transaction.

contract TimeLock is Ownable {
    /// @dev owner address

    /// @dev mapping for transaction status
    mapping(bytes32=>bool) public txStatus;

    /// @dev minimum range
    uint256 public constant MIN_RANGE = 100 seconds;

    /// @dev maximum range
    uint public constant MAX_RANGE = 1000 seconds;
    struct TxData {
        uint256 value;
    }
    constructor() {}

    receive() external payable{}

    /// @dev generate transaction id using target address, value, calldat and timestamp
    function generateTxId(
        address _target,
        uint256 _value,
        bytes calldata _data,
        uint256 _timestamp
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_target, _value, _data, _timestamp));
    }

    /// @notice queue new tx.
    /// @dev only owner can queue new tx.
    function queueTX(
        address _target,
        uint256 _value,
        bytes calldata _data,
        uint256 _timestamp) public onlyOwner returns (bytes32 txId) {
        txId = generateTxId(_target, _value, _data, _timestamp);
        require(!txStatus[txId], "already queued");
        if (block.timestamp < _timestamp + MIN_RANGE || block.timestamp > _timestamp + MAX_RANGE) {
            revert("out of range");
        }
        txStatus[txId] = true;
    }

    /// @notice execute the queued tx.
    /// @dev only owner can execute the queued tx.
    /// @param _target target to execute transaction by owner.
    function execute(
        address _target,
        uint _value,
        bytes calldata _data,
        uint _timestamp
    ) external payable onlyOwner returns (bytes memory) {
        bytes32 txId = generateTxId(_target, _value, _data, _timestamp);(_target, _value, _data, _timestamp);
        txStatus[txId] = false;

        // prepare data

        (bool ok, bytes memory res) = _target.call{value: _value}(_data);
        if (!ok) {
            revert("tx failed");
        }
        return res;
    }

    /// @notice cancel the queued tx.
    /// @dev only owner can cancel the queued tx.
    /// @param txId transaction id to cancel by owner.
    function cancel(bytes32 txId) public onlyOwner {
        require(txStatus[txId] == true, "not queued tx");
        txStatus[txId] = false;
    }
}