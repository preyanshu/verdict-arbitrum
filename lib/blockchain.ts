import { createPublicClient, http, formatUnits, parseAbi, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';
import abiData from './abi.json';

export const ROUTER_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Quantum EVM chain definition
export const quantumEVM = {
    id: 31337, // Localhost/Hardhat default
    name: 'Quantum EVM',
    network: 'quantum-evm',
    nativeCurrency: {
        decimals: 18,
        name: 'Quantum',
        symbol: 'QNTM',
    },
    rpcUrls: {
        public: { http: ['http://127.0.0.1:8545'] },
        default: { http: ['http://127.0.0.1:8545'] },
    },
} as const;

export const publicClient = createPublicClient({
    chain: quantumEVM,
    transport: http(),
});

export const verdictAbi = abiData;

export const getVUSDCBalance = async (address: string): Promise<string> => {
    try {
        const balance = await publicClient.readContract({
            address: ROUTER_ADDRESS as `0x${string}`,
            abi: verdictAbi,
            functionName: 'getVUSDCBalance',
            args: [address as `0x${string}`],
        });

        return formatUnits(balance as bigint, 18);
    } catch (error) {
        console.error('Error fetching vUSDC balance:', error);
        return '0.00';
    }
};

export const claimFaucet = async (walletClient: any): Promise<`0x${string}`> => {
    const [address] = await walletClient.getAddresses();

    const { request } = await publicClient.simulateContract({
        account: address,
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: verdictAbi,
        functionName: 'userFaucet',
    });

    return await walletClient.writeContract(request);
};

export const getVUSDCTokenAddress = async (): Promise<`0x${string}`> => {
    return await publicClient.readContract({
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: verdictAbi,
        functionName: 'vUSDCToken',
    }) as `0x${string}`;
};

export const getYesTokenAddress = async (proposalId: string): Promise<`0x${string}`> => {
    return await publicClient.readContract({
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: verdictAbi,
        functionName: 'getYesTokenAddress',
        args: [proposalId],
    }) as `0x${string}`;
};

export const getSwapQuote = async (proposalId: string, tokenIn: string, amountIn: string): Promise<string> => {
    if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) return '0.00';
    try {
        const quote = await publicClient.readContract({
            address: ROUTER_ADDRESS as `0x${string}`,
            abi: verdictAbi,
            functionName: 'getSwapQuote',
            args: [proposalId, tokenIn as `0x${string}`, parseUnits(amountIn, 18)],
        });
        return formatUnits(quote as bigint, 18);
    } catch (error) {
        console.error('Error getting swap quote:', error);
        return '0.00';
    }
};

export const executeSwap = async (
    walletClient: any,
    proposalId: string,
    tokenIn: string,
    amountIn: string,
    minAmountOut: string
): Promise<`0x${string}`> => {
    const [address] = await walletClient.getAddresses();

    const { request } = await publicClient.simulateContract({
        account: address,
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: verdictAbi,
        functionName: 'swap',
        args: [proposalId, tokenIn as `0x${string}`, parseUnits(amountIn, 18), parseUnits(minAmountOut, 18)],
    });

    return await walletClient.writeContract(request);
};

export const getYESBalance = async (proposalId: string, address: string): Promise<string> => {
    try {
        const balance = await publicClient.readContract({
            address: ROUTER_ADDRESS as `0x${string}`,
            abi: verdictAbi,
            functionName: 'getYESBalance',
            args: [proposalId, address as `0x${string}`],
        });

        return formatUnits(balance as bigint, 18);
    } catch (error) {
        console.error('Error fetching YES balance:', error);
        return '0.00';
    }
};

const erc20Abi = parseAbi([
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
]);

export const getAllowance = async (tokenAddress: string, owner: string, spender: string): Promise<bigint> => {
    try {
        return await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [owner as `0x${string}`, spender as `0x${string}`],
        }) as bigint;
    } catch (error) {
        console.error('Error fetching allowance:', error);
        return BigInt(0);
    }
};

export const approveToken = async (
    walletClient: any,
    tokenAddress: string,
    spender: string,
    amount: bigint = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
): Promise<`0x${string}`> => {
    const [address] = await walletClient.getAddresses();

    const { request } = await publicClient.simulateContract({
        account: address,
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, amount],
    });

    return await walletClient.writeContract(request);
};
