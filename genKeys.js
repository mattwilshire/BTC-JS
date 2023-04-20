const bitcoin = require('bitcoinjs-lib');

/*
    Private key is used to derive a public key.
    This is kept safe and managed by wallets.
    Most wallets like coinbase generate new keys every transaction to stop tracing.
*/
const keyPair = bitcoin.ECPair.makeRandom();
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

/*
    WIF is a shortened version of the private key that is easier to read 
    and type, and it includes a checksum to help prevent errors
    Example: 'Kyb...VnR'
*/
console.log(`Private key: ${keyPair.toWIF()}`);
console.log(`Public address: ${address}`);

console.log(`Link: https://www.blockchain.com/explorer/addresses/btc/${address}`)
