const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

const network = bitcoin.networks.testnet;

// Satoshi lowest unit of bitcoin, this is what is sent in the message.
// 100000000 is one full BTC
function btcToSatoshi(btc) {
    return Math.floor(btc * 100000000);
}

// Address from privateKey
// https://blockstream.info/testnet/api/address/mo59eLG1xhVaS6nQFo7Ma2bjNYnqdqYQST
// This contains the amount of unspent amount at this address, inside chain_stats -> funded_txo_sum
// IMPORTANT : Must use chain_stats, this is confirmed on the chain, mempool_stats is what the site recorded before it got on the chain.
// UI: https://blockstream.info/testnet/address/mo59eLG1xhVaS6nQFo7Ma2bjNYnqdqYQST
const privateKey = 'cQy...Lr';
const fromAddress = 'mo59eLG1xhVaS6nQFo7Ma2bjNYnqdqYQST';

const toAddress = 'mrA9bybosJrqzyRPWDBF5hd7Qxk6j9Nipw';
const changeAddress = 'mokVZfpYujrPLQCQ3afhKqZKDcmuhngkco';

const amount = 0.001;
const fee = 1000; // In Satoshis
let totalAmount;

async function start() {
	/*
		TODO: Change this to use UTXO e.g https://blockstream.info/testnet/api/address/{address}/utxo, combine all UTXO values to get unspent
	*/
	try {
		let response = await axios.get(`https://blockstream.info/testnet/api/address/${fromAddress}`);
		let data = response.data;
	
		let received = data.chain_stats.funded_txo_sum;
		let spent = data.chain_stats.spent_txo_sum;
		totalAmount = received - spent;
	} catch(error) {
		console.error(error);
		process.exit();
	}
	console.log(`Total Sendable Amount in ${fromAddress} : ${totalAmount}`);

	const privateKeyBuffer = bitcoin.ECPair.fromWIF(privateKey, network).privateKey;
	const keyPair = bitcoin.ECPair.fromPrivateKey(privateKeyBuffer, {network: network});
	//const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: network});

	let txHex = await createTransaction(keyPair);

	axios.post('https://blockstream.info/testnet/api/tx', txHex)
	.then((response) => {
		console.log(`Transaction Broadcasted TXID: ${response.data}`);
	})
	.catch((error) => {
		console.error(error);
	});
}

async function createTransaction(keyPair) {
	const transaction = new bitcoin.TransactionBuilder(network);

	//Get last transaction ID and the position of the transaction inside the block
	let response = await axios.get(`https://blockstream.info/testnet/api/address/${fromAddress}/txs`);
	let data = response.data;
	// Get txs that are confirmed
	data = data.filter((d) => d.status.confirmed);

	if(data.length < 1) {
		console.log("No past transaction ID, this address has never had BTC ?");
		process.exit();
	}

	let tx = data[0];
	let txid = tx.txid;
	let txIndex = 0;

	// Go through outputs and find which one was directed to my address
	for(let i = 0; i < tx.vout.length; i++) {
		if(tx.vout[i].scriptpubkey_address == fromAddress) {
			txIndex = i;
			break;
		}
	}

	transaction.addInput(txid, txIndex);
	transaction.addOutput(toAddress, btcToSatoshi(amount));

	transaction.addOutput(changeAddress, totalAmount - btcToSatoshi(amount) - fee);
	transaction.sign(0, keyPair);

	return transaction.build().toHex();
}

start();