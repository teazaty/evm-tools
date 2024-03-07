import { Wallet, ethers, JsonRpcProvider, formatEther, parseEther } from 'ethers';
import fs from 'fs';
import moment from 'moment';
import chalk from 'chalk';
import readline from 'readline';
import axios from 'axios';

const networks = [
    {
        name: 'Binance Smart Chain (BSC)',
        rpcUrl: 'https://bsc-mainnet.nodereal.io/v1/585eec1bbbce4a7c82129001a6096db9',
        chainId: 56,
    },
    {
        name: 'Polygon',
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
    },
    {
        name: 'Ethereum',
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
        chainId: 1,
    },
    {
        name: 'OpBnb',
        rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
        chainId: 204,
    },
    {
        name: 'Arbitrum',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        chainId: 42161,
    },
];

const GAS_API_URL = "https://beaconcha.in/api/v1/execution/gasnow";

async function createAccount(numWallets) {
    const wallets = [];
    for (let i = 0; i < numWallets; i++) {
        const networkIndex = Math.floor(Math.random() * networks.length);
        const network = networks[networkIndex];
        const provider = new JsonRpcProvider(network.rpcUrl);

        const wallet = ethers.Wallet.createRandom();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.publicKey;
        const address = wallet.address;

        wallets.push({
            privateKey,
            publicKey,
            address,
            network
        });
    }

    return wallets;
}

async function transferFunds(privateKey, toAddress, amount, network) {
    const provider = new JsonRpcProvider(network.rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const gasPrice = await getGasPrice();
    const transaction = {
        to: toAddress,
        gasPrice,
        value: parseEther(amount),
        chainId: network.chainId
    };

    const tx = await wallet.sendTransaction(transaction);
    return tx.hash;
}

async function checkBalance(privateKey, network) {
    const provider = new JsonRpcProvider(network.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = wallet.address;
    const balance = await provider.getBalance(address);
    return {
        address,
        balance: formatEther(balance),
        network
    };
}

async function getGasPrice() {
    const response = await axios.get(GAS_API_URL);
    return response.data.gasPrice;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runScript() {
    console.log(chalk.cyan(`██╗    ██╗██╗  ██╗ ██████╗`));
    console.log(chalk.blue(`██║    ██║╚██╗██╔╝██╔════╝`));
    console.log(chalk.red(`██║ █╗ ██║ ╚███╔╝ ██║`));
    console.log(chalk.blue(`██║███╗██║ ██╔██╗ ██║`));
    console.log(chalk.cyan(`╚███╔███╔╝██╔╝ ██╗╚██████╗`));
    console.log(chalk.cyan(` ╚══╝╚══╝ ╚═╝  ╚═╝ ╚═════╝`));
    console.log('');

    console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.green('Starting....')}`);
    console.log('');

    rl.question(`Enter the script number to run:
1. Generate Wallets
2. Transfer Tokens
3. Check Balance\n`, async (scriptNumber) => {
        if (parseInt(scriptNumber) === 1) {
            // Script 1: Generate Wallets
            console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.green('Running Generate Wallets script....')}`);
            console.log('');

            rl.question('Enter the number of wallets to generate: ', async (numWallets) => {
                const num = parseInt(numWallets);
                if (!isNaN(num) && num > 0) {
                    const wallets = await createAccount(num);
                    wallets.forEach((wallet, index) => {
                        console.log(`Processing wallet ${index + 1}: ${wallet.address} - SUCCESS GENERATE`);
                        fs.appendFileSync('./address.txt', `${wallet.address}\n`);
                        fs.appendFileSync('./key.txt', `${wallet.privateKey}\n`);
                    });
                    console.log('');
                    rl.close();
                } else {
                    console.log('Invalid number of wallets.');
                    console.log('');
                    rl.close();
                }
            });
        } else if (parseInt(scriptNumber) === 2) {
            // Script 2: Transfer Tokens
            console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.green('Running Transfer Tokens script....')}`);
            console.log('');

            rl.question('Enter the amount of tokens to transfer: ', async (tokenAmount) => {
                try {
                    const addressFilePath = './address.txt';
                    const addressesData = fs.readFileSync(addressFilePath, 'utf8');
                    const addresses = addressesData.trim().split('\n');
                    const numAddresses = addresses.length;

                    if (!isNaN(numAddresses) && numAddresses > 0) {
                        rl.question('Select the network for token transfer:\n' +
                            networks.map((network, index) => `${index + 1}. ${network.name}`).join('\n') + '\n', async (networkIndex) => {
                                const index = parseInt(networkIndex) - 1;
                                if (!isNaN(index) && index >= 0 && index < networks.length) {
                                    const network = networks[index];

                                    rl.question('Select transfer method:\n' +
                                        '1. Manual - Enter recipient address\n' +
                                        '2. File - Use addresses from a file\n', async (transferMethod) => {
                                            if (parseInt(transferMethod) === 1) {
                                                // Manual Transfer
                                                rl.question('Enter the recipient address: ', async (recipientAddress) => {
                                                    if (recipientAddress.trim() === '') {
                                                        console.log('Recipient address is required.');
                                                        console.log('');
                                                        rl.close();
                                                    } else {
                                                        const privateKeyUtama = fs.readFileSync('./key-utama.txt', 'utf8').trim();
                                                        console.log(`Processing wallet: ${recipientAddress} - Network: ${network.name}`);

                                                        await sleep(10000); // Delay for 10 seconds

                                                        let transferFundsResult = true;
                                                        try {
                                                            console.log(`Transferring ${tokenAmount} tokens to this account!`);
                                                            transferFundsResult = await transferFunds(privateKeyUtama, recipientAddress, tokenAmount, network);
                                                        } catch (error) {
                                                            console.log('Error transferring tokens: ', error);
                                                            transferFundsResult = false;
                                                        }

                                                        if (transferFundsResult) {
                                                            console.log(`${tokenAmount} tokens have been transferred!`);
                                                            console.log('');
                                                        } else {
                                                            console.log('Failed to transfer tokens!');
                                                            console.log('');
                                                        }

                                                        rl.close();
                                                    }
                                                });
                                            } else if (parseInt(transferMethod) === 2) {
                                                // File Transfer
                                                rl.question('Enter the path to the file containing recipient addresses: ', async (recipientFilePath) => {
                                                    try {
                                                        const recipientData = fs.readFileSync(recipientFilePath, 'utf8');
                                                        const recipients = recipientData.trim().split('\n');
                                                        const numRecipients = recipients.length;

                                                        if (!isNaN(numRecipients) && numRecipients > 0) {
                                                            const privateKeyUtama = fs.readFileSync('./key-utama.txt', 'utf8').trim();

                                                            for (let i = 0; i < numRecipients; i++) {
                                                                const recipientAddress = recipients[i].trim();
                                                                console.log(`Processing wallet: ${recipientAddress} - Network: ${network.name}`);

                                                                await sleep(10000 * (i + 1)); // Delay each iteration by 10 seconds

                                                                let transferFundsResult = true;
                                                                try {
                                                                    console.log(`Transferring ${tokenAmount} tokens to this account!`);
                                                                    transferFundsResult = await transferFunds(privateKeyUtama, recipientAddress, tokenAmount, network);
                                                                } catch (error) {
                                                                    console.log('Error transferring tokens: ', error);
                                                                    transferFundsResult = false;
                                                                }

                                                                if (transferFundsResult) {
                                                                    console.log(`${tokenAmount} tokens have been transferred!`);
                                                                    console.log('');
                                                                } else {
                                                                    console.log('Failed to transfer tokens!');
                                                                    console.log('');
                                                                }

                                                                if (i === numRecipients - 1) {
                                                                    console.log(`Finished processing ${numRecipients} recipients.`);
                                                                    rl.close();
                                                                }
                                                            }
                                                        } else {
                                                            console.log('No recipients found in the file. Please make sure the file contains valid addresses, each on a separate line.');
                                                            console.log('');
                                                            rl.close();
                                                        }
                                                    } catch (error) {
                                                        console.log('Error reading the recipient file: ', error);
                                                        console.log('');
                                                        rl.close();
                                                    }
                                                });
                                            } else {
                                                console.log('Invalid transfer method. Please enter either 1 or 2.');
                                                console.log('');
                                                rl.close();
                                            }
                                        });
                                } else {
                                    console.log('Invalid network selection.');
                                    console.log('');
                                    rl.close();
                                }
                            });
                    } else {
                        console.log('No addresses found in the address file. Please make sure the file contains valid addresses, each on a separate line.');
                        console.log('');
                        rl.close();
                    }
                } catch (error) {
                    console.log('Error reading the address file: ', error);
                    console.log('');
                    rl.close();
                }
            });
        } else if (parseInt(scriptNumber) === 3) {
            // Script 3: Check Balance
            console.log(`[ ${moment().format("HH:mm:ss")} ] `, `${chalk.green('Running Check Balance script....')}`);
            console.log('');

            rl.question('Enter the path to the private key file: ', async (privateKeyFilePath) => {
                try {
                    const privateKeyData = fs.readFileSync(privateKeyFilePath, 'utf8');
                    const privateKeys = privateKeyData.trim().split('\n');
                    const numAddresses = privateKeys.length;

                    if (!isNaN(numAddresses) && numAddresses > 0) {
                        rl.question('Select the network for balance checking:\n' +
                            networks.map((network, index) => `${index + 1}. ${network.name}`).join('\n') + '\n', async (networkIndex) => {
                                const index = parseInt(networkIndex) - 1;
                                if (!isNaN(index) && index >= 0 && index < networks.length) {
                                    const network = networks[index];

                                    // Create a separate balance file for each network
                                    const balanceFilePath = `./sisa-saldo-${network.name.toLowerCase().replace(/\s+/g, '-')}.txt`;

                                    // Clear previous balance results
                                    fs.writeFileSync(balanceFilePath, '');

                                    for (let i = 0; i < numAddresses; i++) {
                                        const privateKey = privateKeys[i].trim();
                                        console.log(`Checking balance for address ${i + 1} - Network: ${network.name}`);

                                        await sleep(1000 * (i + 1)); // Delay each iteration by 10 seconds

                                        const result = await checkBalance(privateKey, network);
                                        console.log(`Address : ${result.address}`);
                                        console.log(`Balance : ${result.balance} ${network.name}`);
                                        console.log('');

                                        // Save balance to network-specific balance file
                                        fs.appendFileSync(balanceFilePath, `${result.address}: ${result.balance} ${network.name}\n`);

                                        if (i === numAddresses - 1) {
                                            console.log(`Finished processing ${numAddresses} addresses.`);
                                            rl.close();
                                        }
                                    }
                                } else {
                                    console.log('Invalid network selection.');
                                    console.log('');
                                    rl.close();
                                }
                            });
                    } else {
                        console.log('Invalid private key file. Please make sure the file contains valid private keys, each on a separate line.');
                        console.log('');
                        rl.close();
                    }
                } catch (error) {
                    console.log('Error reading the private key file: ', error);
                    console.log('');
                    rl.close();
                }
            });
        } else {
            console.log('Invalid script number. Please enter either 1, 2, or 3.');
            console.log('');
            rl.close();
        }
    });
}

runScript();
