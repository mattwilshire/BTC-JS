const bitcoin = require('bitcoinjs-lib');
const network = bitcoin.networks.bitcoin;

// Satoshi lowest unit of bitcoin, this is what is sent in the message.
// 100000000 is one full BTC
function btcToSatoshi(btc) {
    return Math.floor(btc * 100000000);
}

const privateKey = 'Kyb...VnR';

// Address from privateKey
const fromAddress = '1K6j6heVrUohPnPzT1vYoQjiLKk74wFzkJ';
// Random ToAddress
const toAddress = '3G3KhrNmLJysqmYGUG5r2bGsNszaoCiBwj';
const amount = 0.00007570; // BTC to send, 2 euro at the time

// Convert WIF private key back to private key hex
const privateKeyBuffer = bitcoin.ECPair.fromWIF(privateKey, network).privateKey;

// Generates keypair (publickey (e.g fromAddress), privatekey) to sign the transaction
const keyPair = bitcoin.ECPair.fromPrivateKey(privateKeyBuffer);

// This address is the same as the fromAddresss above, just showing how to derive it from the private key again
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

// Create a new Bitcoin transaction
const transaction = new bitcoin.TransactionBuilder(network);


// Get the two params from this url https://blockchain.info/unspent?active=1K6j6heVrUohPnPzT1vYoQjiLKk74wFzkJ
// params:  tx_hash_big_endian, tx_output_n

// The tx_hash is the hash of the last transaction that occured on the block from the public address
// Since the block has multiple transactions, we need to specify the one that went to our address which was 31 but will be tx_output_n
// from the API.

// This is to ensure an address has the money it claims to have and also makes sure they don't add multiple transactions,
// meaning you can only make the payment once and not dupe it.
// All this information is viewable using this endpoint https://www.blockchain.com/explorer/addresses/btc/{address}
const lastTX = 'd208e8f593cbe3194a146bb64857251aff2ca390440e5ef6893cfbaa512a1d40';
transaction.addInput(lastTX, 31);

// recipients address and the amount of BTC to send
transaction.addOutput(toAddress, btcToSatoshi(amount));
// Sign the transaction with the private key
transaction.sign(0, keyPair);

// Serialize the transaction and broadcast it to the Bitcoin network
const txHex = transaction.build().toHex();

// Send to the blockchain
const axios = require('axios');
axios.post('https://blockstream.info/api/tx', txHex)
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
});