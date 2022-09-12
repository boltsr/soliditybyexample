// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

/// @title Multi-Sig Wallet
/// @notice Multi-Sig wallet to make transactions after enough owners has approved it.
/// @dev Only owner can withdraw the fund.

contract MultiSig {
    /// @notice Owner address array to participate in transaction confirmation.
    address[] public owners;

    /// @notice Indicate if the address has got owner permission.
    mapping(address => bool) public isOwner;

    /// @notice target confirmation number to execute the transaction.
    uint256 public targetConfirm;

    /// @dev struct of transaction information
    struct Transaction {
        address to;
        uint256 value;
        uint256 confirms;
        bytes data;
        bool executed;
    }

    /// @dev mapping to prove if the special tx is approved
    mapping(uint256 => mapping(address => bool)) public isApproved;

    /// @notice transaction array that is already submitted.
    Transaction[] public txInfo;

    constructor(address[] memory _approvers, uint256 _targetConfirm) {
        require(_approvers.length > 0, "owners required");
        require(
            _targetConfirm > 0 && _targetConfirm <= _approvers.length,
            "invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _approvers.length; i++) {
            address owner = _approvers[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        targetConfirm = _targetConfirm;
    }

    /// @dev this wallet should receive the ETH.
    receive() external payable {}

    /// @notice submit transaction data to storage
    /// @param _to destination addrss
    /// @param _value amount to send
    /// @param _data bytes data to send
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public {
        require(isOwner[msg.sender], "only owner can call this function.");
        txInfo.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                confirms: 0
            })
        );
    }

    /// @notice confirm certain transaction
    /// @param _txIndex transaction index in txInfo to confirm
    function confirmTx(uint256 _txIndex) public {
        require(isOwner[msg.sender], "only owner can call this function.");
        require(_txIndex < txInfo.length, "invalid tx");
        require(!isApproved[_txIndex][msg.sender], "tx already confirmed");
        require(!txInfo[_txIndex].executed, "tx already executed");
        Transaction storage transaction = txInfo[_txIndex];
        transaction.confirms += 1;
        isApproved[_txIndex][msg.sender] = true;
    }

    /// @notice execute certain transaction
    /// @param _txIndex transaction index in txInfo to execute
    function executeTx(uint256 _txIndex) public {
        require(isOwner[msg.sender], "only owner can call this function.");
        require(_txIndex < txInfo.length, "invalid tx");
        require(!txInfo[_txIndex].executed, "tx already executed");

        Transaction storage transaction = txInfo[_txIndex];

        require(transaction.confirms >= targetConfirm, "cannot execute tx");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "tx failed");
    }

    /// @notice revoke certain transaction
    /// @param _txIndex transaction index in txInfo to revoke
    function revokeTx(uint256 _txIndex) public {
        require(isOwner[msg.sender], "only owner can call this function.");

        require(_txIndex < txInfo.length, "invalid tx");
        require(!txInfo[_txIndex].executed, "tx already executed");

        Transaction storage transaction = txInfo[_txIndex];

        require(isApproved[_txIndex][msg.sender], "tx not confirmed");

        transaction.confirms -= 1;
        isApproved[_txIndex][msg.sender] = false;
    }

    /// @notice return cetain transaction data
    /// @param _txIndex transaction index in txInfo to return
    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 confirms
        )
    {
        Transaction storage txData = txInfo[_txIndex];

        return (
            txData.to,
            txData.value,
            txData.data,
            txData.executed,
            txData.confirms
        );
    }
}
