import { Chain } from 'viem/chains';

export const monadTestnet: Chain = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'MONAD',
        symbol: 'MONAD',
    },
    rpcUrls: {
        default: { 
            http: ['https://testnet-rpc.monad.xyz']
        },
        public: {
            http: ['https://testnet-rpc.monad.xyz']
        },
    },
    blockExplorers: {
        default: {
            name: 'Monad Explorer',
            url: 'https://explorer.monad.xyz',
        },
    },
    testnet: true,
    sourceId: 1
}; 