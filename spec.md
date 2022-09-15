1. Ether Wallet

   Description:
   A basic Wallet which can send and receive the ETH
   Spec:

   - The contract should receive the ETH.

   - Only the owner can withdraw.

   - Need view functions to shows the balance of wallet.

2. Multi-Sig Wallet

   Description:
   Create multi-sig wallet to make transactions after enough owners has approved it.

   Spec:

   - The contract should receive the ETH.
   - Need to store the transaction data including "to" address, "amount", "data", "executed", "numConfirmations"
   - Need to store information related confirmation if the special transaction is confirmed by special owner.
   - Owner can Submit transaction to save the transaction info.
   - Owner can approve and revoke approval of pending transactions.
   - Any owner can execute a transcation after enough owners has approved it.
   - View functions to shows the special transactions using txIndex.

3. Merkle Tree

   Description:
   Implement merkle tree to cryptographically prove that an element is contained.

   Spec:

   - verify function if the element is contained

4. Precompute Contract Address with Create2

   Description:
   Implement contract to precompute the address ,before the contract is deployed, using create2

   Spec:

   - implement basic test contract to be deployed.
   - implement contract that returns the address of the newly deployed contract using create2 without assembly.
     • deploy function that deploy the contract using salt value.
   - implement contract that returns the address of deployed contract using create2 with assembly code.
     • implement function to get bytecode of contract to be deployed.
     • implement function to compute the address of the contract to be deployed.
     • implement function to deploy the contract using assembly.

5. Minimal Proxy Contract

   Description:
   Implement minimal proxy contract to deploy the same contract multiple times cheaply.

   Spec:

   - implement clone function using assembly code to deploy the same contract.

6. Implement upgradable proxy contract

   Description:
   Implement minimal proxy contract to deploy the same contract multiple times cheaply.

   Spec:

   - implement set function to set the implementation address.
   - implement the fallback function to receive the ETH.
   - implement the delegate function to call the function as a delegate call using assembly.

7. Deploy Any Contract

   Description:
   Implement proxy contract to deploy contract and call functions using assembly.

   Spec:

   - implement deploy function to using code in byte and assembly.
   - implement execute function to call the function using byte data.
   - imlement the helper contract to get the bytecode in several ways.

8. Write to Any Slot
   Description:
   Implenet storage contract to write information to special storage slot.

   Spec:

   - implement internal get function to get the special storage information.
   - implement external get function to get the special storage information using internal function.
   - implement set external function to write the information to special storage information.

9. Uni-Directional Payment Channel
   Description:
   Implement uni-payment channel to allow participants to repeatedly transfer Ether off chain.

   Alice deploys the contract, funding it with some Ether.
   Alice authorizes a payment by signing a message (off chain) and sends the signature to Bob.
   Bob claims his payment by presenting the signed message to the smart contract.
   If Bob does not claim his payment, Alice get her Ether back after the contract expires(1 Day)

   Spec:

   - implement private and external function to get has, EthSignedHash.
   - implement private and external verify function using ECDSA.
   - implement close and cancel function.

10. Bi-Directional Payment Channel
    Description:
    Implement bi-payment channel to allow participants to repeatedly transfer Ether off chain.

    Opening a channel

    - Alice and Bob fund a multi-sig wallet
    - Precompute payment channel address
    - Alice and Bob exchanges signatures of initial balances
    - Alice and Bob creates a transaction that can deploy a payment channel from

    Update channel balances

    - Repeat steps 1 - 3 from opening a channel
    - From multi-sig wallet create a transaction that will
      •delete the transaction that would have deployed the old payment channel
      • and then create a transaction that can deploy a payment channel with the
      new balances

    Closing a channel when Alice and Bob agree on the final balance

    - From multi-sig wallet create a transaction that will
      •send payments to Alice and Bob
      •and then delete the transaction that would have created the payment channel

    Closing a channel when Alice and Bob do not agree on the final balances

    - Deploy payment channel from multi-sig
    - call challengeExit() to start the process of closing a channel
    - Alice and Bob can withdraw funds once the channel is expired

    Spec:

    - implement very function to check if the signature is valid.
    - user can exit the challenge if the signature is valid and user have enough balance.
    - implement close and cancel function.

11. English Auction
    Description:
    Implement English auction contract for NFT.

    Auction Rule:

    - Seller of NFT deploys this contract.
    - Auction lasts for 7 days.
    - Participants can bid by depositing ETH greater than the current highest bidder.
    - All bidders can withdraw their bid if it is not the current highest bid.

    Spec:

    - implement start function and the nft will be locked int this contract.
    - implement bid and withdraw function .
    - implement end function to close the auction.
      • the NFT will be sent to winner if the best bidder is choosen.
      • the NFT will be sent to owner if the best bidder is not choosen

12. Dutch Auction
    Description:
    Implement English auction contract for NFT.

    Auction Rule:

    - Seller of NFT deploys this contract setting a starting price for the NFT.
    - Auction lasts for 7 days.
    - Price of NFT decreases over time.
    - Participants can buy by depositing ETH greater than the current price computed by the smart contract.
    - Auction ends when a buyer buys the NFT.

    Spec:

    - The contract init the params like startPrice, discountrate, nft address, nftId
    - implement get function to calculate the price using elapsed time and discountRate.
    - implement buy function to buy the nft by depositing ETH greater than the current price.

13. Crowd Fund
    Description:
    Implement Crowd Fund contract.

    Spec:

    - User creates a campaign(creator, goal, pledged, startAt, endAt, claimed).
    - Users can pledge, transferring their token to a campaign.
    - Users can unpledge, transferring their token to a campaign.
    - After the campaign ends, campaign creator can claim the funds if total amount pledged is more than the campaign goal.
    - After the campaign ends, user can refund the funds if total amount pledged is less than the campaign goal.
    - Otherwise, campaign did not reach it's goal, users can withdraw their pledge.
    - All the capmains are should be stored to blockchain

14. Multi Call
    Description:
    Implement the contract that aggregates multiple queries using a for loop and staticcall.

    Spec:

    - Implement the multicall using staticcall.
    - Implement the test contract to test multicall.

15. Multi Delegatecall
    Description:
    Implement the contract that call the multiple functions with a single transaction, using delegatecall.

    Spec:

    - Implement the multicall using delegatecall.
    - Implement the test contract to test multicall.

16. Timelock
    Description:
    Implement the contract that publishes a transaction to be executed in the future.

    Spec:

    - Implement get function to calculate the txID using address, value, func calldata, bytesdata, and timestamp.
    - Owner can queue function to queue the tx or revert if the tx is out of range.
    - Owner can cancel the tx.
    - Min Delay: 100s, Max Delay: 1000s, Lock Period: 1000
