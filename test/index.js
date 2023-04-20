const prompt = require('prompt-sync')();
const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');
const network = bitcoin.networks.testnet;
let quit = false;

async function start() {
    while(!quit) {
        const action = prompt('Action ? (bal, send, quit) : ');
    
        switch(action) {
            case 'bal':
                await bal();
                break;
            case 'send':
                await send();
                break;
            case 'quit':
                quit = true;
                break;
            default:
                break;
        }
    }    
}

function btcToSatoshi(btc) {
    return Math.floor(btc * 100000000);
}

async function bal() {
    let address = prompt('Address: ');
    try {
        let response = await axios.get(`https://blockstream.info/testnet/api/address/${address}`);
		let data = response.data;
	
		let received = data.chain_stats.funded_txo_sum;
		let spent = data.chain_stats.spent_txo_sum;
		let totalAmount = received - spent;
        console.log(`Amount @ ${address} : ${totalAmount} : ${totalAmount / 100000000}`);
    } catch(error) {
        console.log(error);
    }
}

async function send() {
    let privateKey = prompt('Private Key: ');

    const privateKeyBuffer = bitcoin.ECPair.fromWIF(privateKey, network).privateKey;
	const keyPair = bitcoin.ECPair.fromPrivateKey(privateKeyBuffer, {network: network});
	const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: network});

    // Get Balance
    /*
		TODO: Change this to use UTXO e.g https://blockstream.info/testnet/api/address/{address}/utxo, combine all UTXO values to get unspent
        These can be used as multiple inputs to the transactions as you can have the sum of two received transactions and send it to someone.
	*/
    let totalAmount;
    try {
        let response = await axios.get(`https://blockstream.info/testnet/api/address/${address}`);
		let data = response.data;
	
		let received = data.chain_stats.funded_txo_sum;
		let spent = data.chain_stats.spent_txo_sum;
		totalAmount = received - spent;
    } catch(error) {
        console.log(error);
    }

    let amountToSend = prompt(`There is ${totalAmount / 100000000} in this address (${address}), how much do you want to send ? `);
    let amount = parseFloat(amountToSend);
    console.log(amount);

    let sendAddress = prompt(`Send Address: `);
    if(sendAddress == '') {
        return;
    }

    let changeAddress = prompt(`Change Address: `);

    let txHex = await createTransaction(keyPair, address, sendAddress, changeAddress, amount, totalAmount);

    try {
        let resp = axios.post('https://blockstream.info/testnet/api/tx', txHex);
        console.log(`Transaction Broadcasted TXID: ${resp.data}`)
    } catch(error) {
        console.log(error);
    }
}

async function createTransaction(keyPair, fromAddress, sendAddress, changeAddress, amount, totalAmount) {
	const transaction = new bitcoin.TransactionBuilder(network);
    const fee = 1000;

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
	
    if(changeAddress != '') {
        transaction.addOutput(sendAddress, btcToSatoshi(amount));
        transaction.addOutput(changeAddress, totalAmount - btcToSatoshi(amount) - fee);
    } else {
        transaction.addOutput(sendAddress, btcToSatoshi(amount) - fee);
    }

	transaction.sign(0, keyPair);

	return transaction.build().toHex();
}

start();