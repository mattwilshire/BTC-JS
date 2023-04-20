# BTC-JS
Create BitCoin address in JavaScript by generating a private and public key pair and send BTC.

# How it works #
1. Anyone can genereate a private key. (A 256 bit number)
2. Public key is derived from the private key. This key undergoes algorithms to have a checksum and start with a specific number either '1' or '3' to translate to an address. Read more below about this.
3. The address can be seen on https://blockstream.info/address/{address}, any transactions on the blockchain that interact with this address will be logged here.
4. Notice you don't tell anyone that an address is registered, an address is essentially registered when an amount of BTC is sent to it. The chances of getting a private key that someone else has is so unbelievably large that its pretty much impossible.
5. Now the blockchain has a log that this address has an amount of BTC.
6. To send the amount in this address to another address it needs to be signed using the private key to ensure that the person paying actually owns the public address.
7. To make a transaction the transaction id of the payment made to the public address needs to be used. This is a reference to prove that the address has this money and also to stop forging requests.
8. This address has a specific amount in it. If you want to send a portion of the amount inside it you have to specify a change address, this is another address you generate that the change will be sent to. If this isn't done the change goes to the miners.
9. Essentially you will be sending it to two addresses, the receivingAddress with the amount you want to send, the changeAddress with the totalAmount - amount.
10. A fee is also given to miners mormally 1000 satoshis (leave 1000 uncounted for that will be used as the fee).
11. Notice that if you receive BTC from multiple sources you have to reference a transaction ID to use the amount in that transaction. To send money that was collected over time, the input must have both addresses and the inputs should be signed also the same thing with the change address should be done.

# Getting Started
1. Choose live or test network by using the appropriate folder.
2. Run genKeys.js to get private and public key.
3. If you are using testnet, use https://coinfaucet.eu/en/btc-testnet/ to send tBTC to the generated address. (For main net just send BTC to the address *DON'T RECOMMEND*, stay in testnet)
4. Run index.js and use send.


## Blockstream API #
Removing api from the url gives you the UI.
### Live ###
https://blockstream.info/api/address/{address}

Transactions: https://blockstream.info/api/address/{address}/txs

Unspent Transactions: https://blockstream.info/api/address/{address}/utxo

Broadcast Transaction: https://blockstream.info/api/tx

### Test
https://blockstream.info/testnet/api/address/{address}

Transactions: https://blockstream.info/testnet/api/address/{address}/txs

Unspent Transactions: https://blockstream.info/testnet/api/address/{address}/utxo

Broadcast Transaction: https://blockstream.info/testnet/api/tx


# Information about Addresses
Addresses have different formats at the start to mark the functionality and the network they are on (main network / test network).

Test network is used to test software as the coins are worth nothing but uses the same protocol as BTC.

## Live
Generating an address for the main network requires using the genKeys.js file in the **live/** directory.
### P2PKH
Pay-to-Public-Key-Hash is the format of an address that only needs to use a private key to verify identity. (move funds out of it)

These addresses start with '1'.
> 1K6j6heVrUohPnPzT1vYoQjiLKk74wFzkJ


### P2SH
Pay-to-Script-Hash is the format of an address that requires a script that defines the conditions under which a transaction can be spent.

The address can be created by two public keys.
To move BTC out of that address (verify identity) the private keys belonging to the public keys need to be verified.

These addresses start with '3'.
> 39DZcGCWAMjFLXL3dZ7mNjiLKk74wvdgr8

## Test
Generating an address for the main network requires using the genKeys.js file in the **test/** directory.
## P2PKH
Addresses start with 'm' or 'n' to mark them as test addresses. (Aren't valid as BTC main network addresses)

## P2SH
Addresses start with '2' to mark them as test addresses.
