const bitcoin = require('bitcoinjs-lib');
const request = require('request-promise');

// Set up the Testnet address to watch
const address = 'mo59eLG1xhVaS6nQFo7Ma2bjNYnqdqYQST';

//const endpoint = 'https://blockstream.info/api'; // Live endpoint
const endpoint = 'https://blockstream.info/testnet/api';

const seenTxids = new Set();

const callback = (tx) => {
  console.log(`New transaction detected for address ${address}: ${tx.txid} : Price ${tx.value}`);
};

setInterval(() => {
    request(`${endpoint}/address/${address}/txs`).then((response) => {
        const txs = JSON.parse(response);

        const confirmedTxs = txs.filter((tx) => !seenTxids.has(tx.txid) && tx.status.confirmed);

        for(let confirmed of confirmedTxs) {
            // Get the outputs of each Tx, there can be many if they decided to send to someone else too.
            // Most of the time another address will be in here which is the change address, check readme for info on this.
            for(let vout of confirmed.vout) {
                if(vout.scriptpubkey_address == address) {
                    let data = {
                        txid: confirmed.txid,
                        value: vout.value
                    }
                    callback(data);
                }
            }
        }

        confirmedTxs.forEach((tx) => seenTxids.add(tx.txid));
    }).catch((error) => {
      console.error(`Error getting transactions for address ${address}: ${error}`);
    });
}, 1000);