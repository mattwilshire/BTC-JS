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

function satoshiToBtc(sat) {
    return sat / 100000000;
}

async function getUTXOs(address, completed=true) {
    try {
        let response = await axios.get(`https://blockstream.info/testnet/api/address/${address}/utxo`);
        let data = response.data;

        if(completed) {
            data = data.filter((d) => d.status.confirmed);
        }
        
        return data;
    } catch(error) {
        console.log("Cannot get UTXOs of address, is the address correct ?");
        return null;
    }
}

async function getBalance(address) {
    let utxos = await getUTXOs(address);
    let balance = utxos.reduce((accumulator, object) => accumulator + object.value, 0);
    return balance;
}

async function bal() {
    let address = prompt('Address: ');
    let utxos = await getUTXOs(address);

    for(let utxo of utxos) {
        console.log(`UTXO -> ${utxo.txid} -> ${utxo.value} : ${satoshiToBtc(utxo.value)}`);
    }

    let balance = await getBalance(address);
    console.log(`Amount @ ${address} : ${balance} : ${satoshiToBtc(balance)}`);
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
    let totalAmount = await getBalance(address);

    let amountToSend = prompt(`There is ${totalAmount / 100000000} in this address (${address}), how much do you want to send (In Satoshis) ? `);
    // let amount = parseFloat(amountToSend);
    let amount = parseInt(amountToSend);
    console.log(amount);

    let sendAddress = prompt(`Send Address: `);
    if(sendAddress == '') {
        return;
    }

    let changeAddress = prompt(`Change Address: `);

    let txHex = await createTransaction(keyPair, address, sendAddress, changeAddress, amount);

    try {
        let resp = await axios.post('https://blockstream.info/testnet/api/tx', txHex);
        console.log(`Transaction Broadcasted TXID: ${resp.data}`)
    } catch(error) {
        console.log(error);
    }
}

async function createTransaction(keyPair, fromAddress, sendAddress, changeAddress, amount) {
	const transaction = new bitcoin.TransactionBuilder(network);
    const fee = 1000;

    let allUtxos = await getUTXOs(fromAddress);

    let utxos = [];
    let accumAmount = 0;
    let i = 0;

    // Add up utxos to get above the sending amount
    while(accumAmount < amount + fee) {
        utxos.push(allUtxos[i]);
        accumAmount += allUtxos[i].value;
        i++;
    }

    console.log(`Amount to send is ${amount}`);

    let changeToSend = accumAmount - amount - fee;
    console.log(`Amount sent to change address is ${changeToSend} (this is with fees taken away)`);
    console.log(`Amount of UTXOS to be used ${utxos.length}`);

    let confirm = prompt(`Send ? y/n: `);

    if(confirm != 'y') return null;
    
    for(let utxo of utxos) {
        // Add previous UTXOs as input
        transaction.addInput(utxo.txid, utxo.vout);
    }
	
    if(changeAddress != '') {
        transaction.addOutput(sendAddress, amount);
        transaction.addOutput(changeAddress, accumAmount - amount - fee);
    } else {
        transaction.addOutput(sendAddress, amount + fee);
    }

    for(let i = 0; i < utxos.length; i++) {
        // Sign UTXO inputs
        transaction.sign(i, keyPair);
    }

	return transaction.build().toHex();
}

start();