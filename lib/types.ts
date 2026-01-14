export interface MarketStrategy {
    id: string;
    name: string;
    description: string;
    evaluationLogic: string;
    mathematicalLogic?: string;
    usedDataSources?: Array<{
        id: number;
        currentValue: number;
        targetValue: number;
        operator?: string;
    }>;
    resolutionDeadline: number;
    yesToken: TokenInfo;
    noToken: TokenInfo;
    timestamp: number;
    resolved: boolean;
    winner: 'yes' | 'no' | null;
}

export interface TokenInfo {
    tokenReserve?: number;
    volume?: number;
    history: Array<{ price: number; timestamp: number }>;
    twap: number;
    twapHistory?: Array<{ twap: number; timestamp: number }>;
}

// Market state with multiple strategies
export interface MarketState {
    strategies: MarketStrategy[];
    timestamp: number;
    roundNumber: number;
    roundStartTime: number;
    roundEndTime: number;
    roundDuration: number; // in milliseconds
    roundsUntilResolution: number;
    lastRoundEndTime: number | null;
    isExecutingTrades: boolean;
    isMakingBatchLLMCall: boolean;
}

export type StrategyType = 'yes-no' | 'twap' | 'momentum' | 'mean-reversion';

export interface AgentPersonality {
    name: string;
    riskTolerance: 'low' | 'medium' | 'high';
    aggressiveness: number; // 0-1
    memo: string;
    traits: string[];
}

export interface AgentTokenHoldings {
    strategyId: string;
    tokenType: 'yes' | 'no';
    quantity: number;
}

export interface AgentRoundMemory {
    action: 'buy' | 'sell' | 'hold';
    strategyId: string;
    tokenType: 'yes' | 'no';
    quantity: number;
    price: number;
    reasoning: string;
    timestamp: number;
}

export interface Agent {
    id: string;
    personality: AgentPersonality;
    vUSD: number;
    tokenHoldings: AgentTokenHoldings[];
    wallet: {
        address: string;
        derivationPath: string;
    };
    trades: Array<{
        type: 'buy' | 'sell';
        strategyId: string;
        tokenType: 'yes' | 'no';
        price: number;
        quantity: number;
        timestamp: number;
        reasoning?: string;
        txHash?: string;
    }>;
}

export interface LogEntry {
    timestamp: string;
    source: 'System' | 'Market' | 'Trading' | 'Agents' | 'LLM';
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
}

export interface TradeDecision {
    agentId: string;
    action: 'buy' | 'sell' | 'hold';
    strategyId: string;
    tokenType: 'yes' | 'no';
    quantity: number;
    price: number;
    reasoning: string;
}
