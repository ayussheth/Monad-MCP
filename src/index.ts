/**
 * Monad Wallet MCP
 * A command-line tool for managing cryptocurrency transactions on Monad Network
 */

import { createPublicClient, createWalletClient, http, formatEther, parseEther } from "viem";
import { monadTestnet } from './chain';
import { privateKeyToAccount } from "viem/accounts";
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

// Initialize Monad client
const monadClient = createPublicClient({
    chain: monadTestnet,
    transport: http()
});

// Simplified transaction interface
interface MonadTransaction {
    id: string;
    timestamp: number;
    sender: string;
    recipient: string;
    amount: string;
    status: 'pending' | 'confirmed' | 'failed';
}

// Monad Wallet Manager
class MonadWalletManager {
    private static readonly TX_LOG_PATH = join(__dirname, 'monad_transactions.json');
    private static readonly GAS_LIMIT = 21000n;

    static async checkBalance(address: string): Promise<string> {
        try {
            const balance = await monadClient.getBalance({ address: address as `0x${string}` });
            return formatEther(balance);
        } catch (error) {
            throw new Error(`Failed to check balance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    static async sendMonad(
        senderKey: string,
        recipient: string,
        amount: string
    ): Promise<string> {
        try {
            const account = privateKeyToAccount(senderKey as `0x${string}`);
            const walletClient = createWalletClient({
                account,
                chain: monadTestnet,
                transport: http()
            });

            // Get current gas price
            const gasPrice = await monadClient.getGasPrice();
            
            // Calculate total gas cost
            const gasCost = gasPrice * this.GAS_LIMIT;
            
            // Ensure sufficient balance
            const balance = await monadClient.getBalance({ address: account.address });
            const totalRequired = parseEther(amount) + gasCost;
            
            if (balance < totalRequired) {
                throw new Error('Insufficient balance for transaction and gas fees');
            }

            // Send transaction
            const hash = await walletClient.sendTransaction({
                account,
                to: recipient as `0x${string}`,
                value: parseEther(amount),
                gasLimit: this.GAS_LIMIT,
                chain: monadTestnet
            });

            // Log transaction
            await this.logTransaction({
                id: hash,
                timestamp: Date.now(),
                sender: account.address,
                recipient,
                amount,
                status: 'pending'
            });

            // Wait for confirmation
            const receipt = await monadClient.waitForTransactionReceipt({ hash });
            
            // Update transaction status
            await this.updateTransactionStatus(hash, receipt.status ? 'confirmed' : 'failed');

            return hash;
        } catch (error) {
            throw new Error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private static async logTransaction(tx: MonadTransaction): Promise<void> {
        try {
            const transactions = await this.getTransactionHistory();
            transactions.push(tx);
            await writeFile(this.TX_LOG_PATH, JSON.stringify(transactions, null, 2));
        } catch (error) {
            console.error('Failed to log transaction:', error);
        }
    }

    private static async updateTransactionStatus(
        txId: string,
        status: MonadTransaction['status']
    ): Promise<void> {
        try {
            const transactions = await this.getTransactionHistory();
            const txIndex = transactions.findIndex(tx => tx.id === txId);
            if (txIndex !== -1) {
                transactions[txIndex].status = status;
                await writeFile(this.TX_LOG_PATH, JSON.stringify(transactions, null, 2));
            }
        } catch (error) {
            console.error('Failed to update transaction status:', error);
        }
    }

    static async getTransactionHistory(): Promise<MonadTransaction[]> {
        try {
            const data = await readFile(this.TX_LOG_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }
}

// ASCII Art Banner with colors
const monadBanner = `
\x1b[95m
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  ███╗   ███╗ ██████╗ ███╗   ██╗ █████╗ ██████╗       ║
║  ████╗ ████║██╔═══██╗████╗  ██║██╔══██╗██╔══██╗      ║
║  ██╔████╔██║██║   ██║██╔██╗ ██║███████║██║  ██║      ║
║  ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔══██║██║  ██║      ║
║  ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║  ██║██████╔╝      ║
║  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚═════╝       ║
║                                                        ║
╚════════════════════════════════════════════════════════╝\x1b[0m

\x1b[1m🔷 Monad Wallet MCP - Command Line Interface\x1b[0m
`;

// Main function
async function main() {
    const command = process.argv[2];
    
    if (!command || command === 'help' || command === 'index.js') {
        console.log(`
\x1b[36m📋 Available Commands:\x1b[0m

  check    <address>                     - Check MONAD balance of an address
  transfer <private-key> <to> <amount>   - Send MONAD tokens
  history                                - View your transaction history
  info                                   - Display Monad network information
  gas                                    - Show current gas price

\x1b[36m💡 Examples:\x1b[0m
  $ node build/index.js check 0x123...   - Check balance
  $ node build/index.js transfer <key> 0x456... 1.5  - Send 1.5 MONAD
  $ node build/index.js history          - View transactions

\x1b[33mNote: All amounts are in MONAD tokens\x1b[0m
        `);
        return;
    }

    try {
        switch (command) {
            case 'check': {
                const address = process.argv[3];
                if (!address?.match(/^0x[a-fA-F0-9]{40}$/)) {
                    throw new Error("Invalid Monad address format");
                }
                const balance = await MonadWalletManager.checkBalance(address);
                console.log(`\n💰 Account Balance`);
                console.log(`Address: ${address}`);
                console.log(`Balance: ${balance} MONAD\n`);
                break;
            }

            case 'transfer': {
                const [_, __, ___, privateKey, toAddress, amount] = process.argv;
                if (!privateKey?.match(/^0x[a-fA-F0-9]{64}$/)) {
                    throw new Error("Invalid private key format");
                }
                if (!toAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
                    throw new Error("Invalid Monad address format");
                }
                if (!amount?.match(/^\d*\.?\d+$/)) {
                    throw new Error("Invalid amount format");
                }
                
                console.log(`\n🚀 Initiating MONAD Transfer`);
                console.log(`To: ${toAddress}`);
                console.log(`Amount: ${amount} MONAD`);
                const hash = await MonadWalletManager.sendMonad(privateKey, toAddress, amount);
                console.log(`\n📝 Transaction Details`);
                console.log(`Status: Submitted`);
                console.log(`Hash: ${hash}`);
                console.log(`\n⏳ Waiting for confirmation...\n`);
                break;
            }

            case 'history': {
                const history = await MonadWalletManager.getTransactionHistory();
                if (history.length === 0) {
                    console.log('\n📭 No transaction history found.\n');
                } else {
                    console.log('\n📋 Monad Transaction History\n');
                    history.forEach((tx, index) => {
                        console.log(`Transaction #${index + 1}`);
                        console.log(`🆔 ID: ${tx.id}`);
                        console.log(`⏰ Time: ${new Date(tx.timestamp).toLocaleString()}`);
                        console.log(`📤 From: ${tx.sender}`);
                        console.log(`📥 To: ${tx.recipient}`);
                        console.log(`💎 Amount: ${tx.amount} MONAD`);
                        console.log(`${getStatusEmoji(tx.status)} Status: ${tx.status.toUpperCase()}\n`);
                    });
                }
                break;
            }

            case 'info': {
                console.log('\n🔷 Monad Network Information');
                console.log(`Network: ${monadTestnet.name}`);
                console.log(`Chain ID: ${monadTestnet.id}`);
                console.log(`Currency: ${monadTestnet.nativeCurrency.name} (${monadTestnet.nativeCurrency.symbol})`);
                console.log(`RPC URL: ${monadTestnet.rpcUrls.default.http[0]}\n`);
                break;
            }

            case 'gas': {
                const gasPrice = await monadClient.getGasPrice();
                const gasPriceGwei = formatEther(gasPrice * BigInt(1e9));
                console.log('\n⛽ Current Gas Price');
                console.log(`${gasPriceGwei} Gwei\n`);
                break;
            }

            default:
                throw new Error(`Unknown command: ${command}. Type 'node build/index.js help' for usage information.`);
        }
    } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Helper function for status emojis
function getStatusEmoji(status: MonadTransaction['status']): string {
    switch (status) {
        case 'pending': return '⏳';
        case 'confirmed': return '✅';
        case 'failed': return '❌';
        default: return '❓';
    }
}

// Entry point
console.log('\x1b[40m\x1b[36m> monad-mcp by ayussh\x1b[0m');
console.log('\x1b[40m\x1b[36m> starting wallet service...\x1b[0m');
console.log(monadBanner);

main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});