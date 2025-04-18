# Monad Wallet MCP

A command-line interface for managing cryptocurrency transactions on the Monad Network. Built with TypeScript and Viem.

## Features

- Check wallet balances
- Send tokens to other addresses
- Track transaction history
- Monitor token transfers
- View detailed transaction logs

## Quick Start

1. Clone this repository:
```bash
git clone <your-repo-url>
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build --silent
```

4. Run the wallet:
```bash
node build/index.js
```

## Commands

### Check Balance
```bash
node build/index.js check <address>
```

### Send Tokens
```bash
node build/index.js transfer <private-key> <to-address> <amount>
```

### View Transaction History
```bash
node build/index.js history
```

### Check Network Info
```bash
node build/index.js info
```

### Check Gas Price
```bash
node build/index.js gas
```

## Security Notes

- Never share your private keys
- Double-check addresses before sending
- Keep your keys secure
- Use testnet for testing

## Development

This project uses:
- TypeScript for type safety
- Viem for blockchain interactions
- Node.js for runtime
- ES modules for imports

## Contact

For support or questions, open an issue in the repository.