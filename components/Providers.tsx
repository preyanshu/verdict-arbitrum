"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import { quantumEVM } from '@/lib/blockchain';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId="cmh5eorlh00njkw0b5bzymlcv"
            config={{
                loginMethods: ['google', 'wallet', 'email'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#10b981', // emerald-500
                    showWalletLoginFirst: false,
                },
                supportedChains: [quantumEVM],
                defaultChain: quantumEVM,
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    }
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
