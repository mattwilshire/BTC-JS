const bitcoin = require('bitcoinjs-lib');

/*
    Generates private key and address for the mainnet.

    The Pay-to-Public-Key-Hash addresses start with prefix 1
    P2PKH addresses just require the private key to be known.

    Addresses can also start with 3 for Pay-to-Script-Hash addresses, these require multiple public keys to generate and
    to make a transaction a challenge must be done using the private keys of the public keys.
/*

/*
    Private key is used to derive a public key.
    This private key is kept safe and managed by wallets.
    Most wallets like coinbase generate new keys every transaction to stop tracing.
*/
const keyPair = bitcoin.ECPair.makeRandom();
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

/*
    WIF is a shortened version of the private key that is easier to read and it includes a checksum to help prevent errors
    Example: 'Kyb...VnR'

    The address is also a conversion from the public key as it has the 1 or 3 at the 
    start and a checksum to ensure its a valid address.
*/
console.log(`Private key: ${keyPair.toWIF()}`);
console.log(`Public address: ${address}`);

console.log(`Link: https://www.blockchain.com/explorer/addresses/btc/${address}`)
