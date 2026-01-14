import { MarketState, MarketStrategy, Agent, LogEntry } from "./types";

const BASE_URL = "http://localhost:3000";

export const api = {
    // Market Data
    async getMarketState(): Promise<MarketState> {
        const response = await fetch(`${BASE_URL}/api/market`);
        if (!response.ok) throw new Error("Failed to fetch market state");
        return response.json();
    },

    async getGraduatedStrategies(): Promise<MarketStrategy[]> {
        const response = await fetch(`${BASE_URL}/api/history`);
        if (!response.ok) throw new Error("Failed to fetch history");
        return response.json();
    },

    // Agent Data
    async getAgents(): Promise<Agent[]> {
        const response = await fetch(`${BASE_URL}/api/agents`);
        if (!response.ok) throw new Error("Failed to fetch agents");
        return response.json();
    },

    async getAgentById(id: string): Promise<Agent> {
        const response = await fetch(`${BASE_URL}/api/agents/${id}`);
        if (!response.ok) throw new Error(`Failed to fetch agent ${id}`);
        return response.json();
    },

    // System Logs
    async getLogs(): Promise<LogEntry[]> {
        const response = await fetch(`${BASE_URL}/api/logs`);
        if (!response.ok) throw new Error("Failed to fetch logs");
        return response.json();
    },

    // Administrative Controls
    async initProposals(): Promise<void> {
        const response = await fetch(`${BASE_URL}/api/init/proposals`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to initialize proposals");
    },

    async initAgents(): Promise<void> {
        const response = await fetch(`${BASE_URL}/api/init/agents`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to initialize agents");
    },

    async startTradeLoop(): Promise<void> {
        const response = await fetch(`${BASE_URL}/api/trade/start`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to start trade loop");
    },

    async stopTradeLoop(): Promise<void> {
        const response = await fetch(`${BASE_URL}/api/trade/stop`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to stop trade loop");
    },

    async executeTrades(): Promise<void> {
        const response = await fetch(`${BASE_URL}/api/trade/execute`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to execute trades");
    }
};
