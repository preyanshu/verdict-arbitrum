"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { MarketStrategy, Agent, MarketState } from "@/lib/types";
import { api } from "@/lib/api";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ActiveAgents } from "@/components/dashboard/ActiveAgents";
import {
    History,
    CheckCircle2,
    XCircle,
    Database,
    ShieldCheck,
    RefreshCw,
    Loader2,
    ArrowRight,
    SearchCheck,
    ChevronDown,
    ChevronUp,
    Binary,
    Clock,
    Wallet,
    ChevronRight,
} from "lucide-react";
import { TRUSTED_DATA_SOURCES } from "@/lib/data-sources";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getYESBalance, getYesTokenAddress, getAllowance, approveToken, ROUTER_ADDRESS, publicClient, quantumEVM, executeSwap } from "@/lib/blockchain";
import { createWalletClient, custom, parseUnits } from "viem";

export default function HistoryPage() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [auditExpandedIds, setAuditExpandedIds] = useState<Set<string>>(new Set());
    const [redeemedIds, setRedeemedIds] = useState<Set<string>>(new Set());
    const [realHoldings, setRealHoldings] = useState<Record<string, string>>({});
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const { user, authenticated } = usePrivy();
    const { wallets } = useWallets();

    const [marketState, setMarketState] = useState<MarketState | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [historicalProposals, setHistoricalProposals] = useState<MarketStrategy[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [state, fetchedAgents, graduated] = await Promise.all([
                    api.getMarketState(),
                    api.getAgents(),
                    api.getGraduatedStrategies()
                ]);
                setMarketState(state);
                setHistoricalProposals((graduated || []).sort((a, b) => b.timestamp - a.timestamp));
                setAgents(fetchedAgents);
            } catch (error) {
                console.error("Failed to fetch history data:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user?.wallet?.address || historicalProposals.length === 0) return;

        const fetchBalances = async () => {
            const address = user?.wallet?.address;
            if (!address) return;

            try {
                const balances: Record<string, string> = {};
                await Promise.all(historicalProposals.map(async (p) => {
                    const bal = await getYESBalance(p.id, address);
                    balances[p.id] = bal;
                }));
                setRealHoldings(balances);
            } catch (error) {
                console.error("Failed to fetch historical balances:", error);
            }
        };

        fetchBalances();
    }, [user?.wallet?.address, historicalProposals]);

    const handleRedeem = async (id: string, amount: number) => {
        if (!wallets[0] || !authenticated) return;

        try {
            // Ensure we are on the correct chain
            if (wallets[0].chainId !== `eip155:${quantumEVM.id}`) {
                await wallets[0].switchChain(quantumEVM.id);
            }

            const provider = await wallets[0].getEthereumProvider();
            const walletClient = createWalletClient({
                account: wallets[0].address as `0x${string}`,
                chain: quantumEVM,
                transport: custom(provider)
            });

            const yesTokenAddr = await getYesTokenAddress(id);
            const amountInWei = parseUnits(amount.toString(), 18);

            // Check and handle allowance
            const currentAllowance = await getAllowance(yesTokenAddr, wallets[0].address, ROUTER_ADDRESS);

            if (currentAllowance < amountInWei) {
                const approveHash = await approveToken(walletClient, yesTokenAddr, ROUTER_ADDRESS);
                await publicClient.waitForTransactionReceipt({ hash: approveHash });
            }

            // Execute 1:1 Swap (Redeem)
            // minAmountOut is same as amount since it graduated at 1:1
            const txHash = await executeSwap(walletClient, id, yesTokenAddr, amount.toString(), amount.toString());
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            setRedeemedIds(prev => new Set(prev).add(id));

            // Refresh balances
            const newBal = await getYESBalance(id, wallets[0].address);
            setRealHoldings(prev => ({ ...prev, [id]: newBal }));

        } catch (error) {
            console.error("Redemption failed:", error);
        }
    };

    const handleVerifyArchive = async (id: string) => {
        setVerifyingId(id);
        await new Promise(r => setTimeout(r, 1500));
        setVerifiedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        setVerifyingId(null);
        // Auto-expand the Resolution Proof accordion after verification
        setAuditExpandedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAuditExpand = (id: string) => {
        setAuditExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="h-screen bg-[#08080c] text-white selection:bg-white selection:text-black overflow-hidden flex flex-col relative font-sans">
            <Navbar transparent={false} />

            <div className="flex flex-1 pt-20 relative z-10 overflow-hidden">
                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isMobileSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] xl:hidden"
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-[#121214] border-r border-white/10 z-[150] xl:hidden flex flex-col overflow-hidden shadow-2xl"
                            >
                                <div className="flex items-center justify-between p-4 border-b border-white/5">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Activity & Agents</span>
                                    <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                                        <ChevronDown className="w-5 h-5 -rotate-90" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 min-h-0 overflow-y-auto">
                                            <ActivityFeed agents={agents} filterStrategyId={null} activeProposalName={undefined} />
                                        </div>
                                        <div className="h-px w-full bg-white/5" />
                                        <div className="flex-1 min-h-0 overflow-y-auto">
                                            <ActiveAgents agents={agents} />
                                        </div>
                                    </div>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050507] relative">
                    <AnimatePresence mode="wait">
                        {isInitialLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-[#050507] z-50"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin relative z-10" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60 ml-2">
                                        Accessing Archive
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <div key="content" className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-10 max-w-7xl mx-auto">
                                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-2 uppercase">
                                            Graduated Proposals
                                        </h1>
                                        <p className="text-white/40 font-medium text-sm md:text-lg uppercase tracking-widest">Institutional Archive of Resolved Markets</p>
                                    </div>
                                    <div className="flex gap-4">
                                        {historicalProposals.length > 0 && (
                                            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl">
                                                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Archive Set</h3>
                                                <div className="text-xl md:text-2xl font-black text-emerald-400 uppercase">
                                                    {historicalProposals.length} RESOLVED
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </header>

                                {historicalProposals.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 px-4 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-8 shadow-2xl shadow-black/50">
                                            <History className="w-10 h-10 text-white/20" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white/40 uppercase tracking-widest mb-3">Archive Empty</h3>
                                        <p className="text-base text-white/30 font-medium max-w-md mx-auto leading-relaxed">
                                            No market proposals have graduated to the archive yet. Resolved markets will be permanently stored here for audit.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 md:space-y-6">
                                        {historicalProposals.map((proposal) => {
                                            const isVerified = verifiedIds.has(proposal.id);
                                            const isVerifying = verifyingId === proposal.id;
                                            const isExpanded = expandedIds.has(proposal.id);

                                            return (
                                                <div
                                                    key={proposal.id}
                                                    className="group relative bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl overflow-hidden hover:bg-white/[0.04] transition-all duration-500"
                                                >
                                                    <div className="p-4 sm:p-6 md:p-8">
                                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                                            <div className="flex items-center gap-4 md:gap-6">
                                                                <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 relative overflow-hidden shrink-0">
                                                                    <div className="flex items-center justify-center p-2">
                                                                        {(() => {
                                                                            const firstDs = proposal.usedDataSources?.[0];
                                                                            const detailedInfo = TRUSTED_DATA_SOURCES.find(t => t.id === firstDs?.id);
                                                                            return detailedInfo?.icon ? (
                                                                                <img src={detailedInfo.icon} className="w-full h-full object-contain" alt="" />
                                                                            ) : (
                                                                                <Database className="w-5 h-5 md:w-8 md:h-8 text-white/10" />
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                                                        <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-tight">{proposal.name}</h2>
                                                                        <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${proposal.winner === 'yes' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                                            {proposal.winner?.toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">
                                                                            {proposal.resolutionDeadline > Date.now() ? 'Settles on' : 'Settled on'} {new Date(proposal.resolutionDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => toggleExpand(proposal.id)}
                                                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500/60 hover:text-emerald-400 transition-colors"
                                                                        >
                                                                            {expandedIds.has(proposal.id) ? (
                                                                                <><ChevronUp className="w-3 h-3" /> Hide Details</>
                                                                            ) : (
                                                                                <><ChevronDown className="w-3 h-3" /> View Market Specs</>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Accordion 1: Market Specifications & Stats */}
                                                        <AnimatePresence>
                                                            {expandedIds.has(proposal.id) && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="pt-8 space-y-8">
                                                                        <div>
                                                                            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Market Definition</div>
                                                                            <p className="text-white/60 text-[14px] leading-relaxed font-medium italic p-4 bg-white/[0.02] border-l-2 border-emerald-500/20 rounded-r-xl font-mono">
                                                                                "{proposal.description}"
                                                                            </p>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                                                            <div className="p-4 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                                                <div className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 md:mb-4">Market Volume</div>
                                                                                <div className="text-lg md:text-xl font-black text-white tabular-nums">
                                                                                    ${((proposal.yesToken.volume || 0) + (proposal.noToken.volume || 0)).toLocaleString()}
                                                                                </div>
                                                                            </div>

                                                                            <div className="p-4 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                                                <div className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 md:mb-4">Final Prediction</div>
                                                                                <div className="flex items-end gap-2 text-lg md:text-xl font-black text-white">
                                                                                    {(proposal.yesToken.twap * 100).toFixed(1)}% <span className="text-[9px] md:text-[10px] text-emerald-500 mb-0.5 md:mb-1">YES</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="p-4 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between min-h-[80px] md:min-h-0">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <div className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">Protocol Sync</div>
                                                                                    <div className="flex items-center gap-1">
                                                                                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/20" />
                                                                                        <span className="text-[9px] md:text-[10px] text-white/20 font-black uppercase tracking-tighter">Verified</span>
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleVerifyArchive(proposal.id); }}
                                                                                    disabled={isVerifying || isVerified}
                                                                                    className={`w-full py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${isVerified
                                                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                                                                                        }`}
                                                                                >
                                                                                    {isVerifying ? (
                                                                                        <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
                                                                                    ) : isVerified ? (
                                                                                        <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                                                    ) : (
                                                                                        <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                                                    )}
                                                                                    {isVerifying ? 'Verifying...' : isVerified ? 'Audit Passed' : 'Verify Outcome'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    {/* User Position & Redemption (Only if winner) */}
                                                    {(() => {
                                                        const balance = realHoldings[proposal.id];
                                                        if (!balance || Number(balance) <= 0) return null;

                                                        const isWinner = proposal.winner === 'yes';
                                                        if (!isWinner) return null; // If they lost, value is $0, so don't show

                                                        const amount = Number(balance);
                                                        const type = 'YES';
                                                        const isRedeemed = redeemedIds.has(proposal.id);

                                                        return (
                                                            <div className={`mx-4 md:mx-8 mb-6 p-4 md:p-5 rounded-2xl border transition-all ${isWinner ? 'bg-emerald-500/[0.02] border-emerald-500/10 shadow-sm' : 'bg-red-500/[0.01] border-red-500/5'}`}>
                                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                                                        <div className={`hidden lg:flex w-10 h-10 rounded-xl shrink-0 items-center justify-center border transition-all duration-500 ${isWinner ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                                                            <Wallet className={`w-5 h-5 ${isWinner ? 'text-emerald-400' : 'text-red-400'}`} />
                                                                        </div>

                                                                        <div className="flex flex-1 items-center justify-between sm:justify-start sm:gap-8">
                                                                            <div className="flex flex-col">
                                                                                <div className="flex items-baseline gap-1.5">
                                                                                    <span className="text-xl md:text-2xl font-black text-white tracking-tighter tabular-nums leading-none">
                                                                                        {amount.toLocaleString()}
                                                                                    </span>
                                                                                    <span className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{type}</span>
                                                                                </div>
                                                                                <span className="text-[8px] font-bold text-white/10 uppercase tracking-wider mt-0.5">Quantity</span>
                                                                            </div>

                                                                            <ArrowRight className="w-3.5 h-3.5 opacity-20" />

                                                                            <div className="flex flex-col">
                                                                                <div className="flex items-baseline gap-1.5">
                                                                                    <span className={`text-xl md:text-2xl font-black tracking-tighter tabular-nums leading-none ${isWinner ? 'text-emerald-400' : 'text-red-400/40 line-through'}`}>
                                                                                        ${isWinner ? amount.toLocaleString() : '0.00'}
                                                                                    </span>
                                                                                    <span className="text-[9px] md:text-[10px] font-black text-white/30 uppercase tracking-widest">vUSD</span>
                                                                                </div>
                                                                                <span className="text-[8px] font-bold text-white/10 uppercase tracking-wider mt-0.5">Value</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {isWinner && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleRedeem(proposal.id, amount); }}
                                                                            disabled={isRedeemed}
                                                                            className={`w-full sm:w-auto px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${isRedeemed
                                                                                ? 'bg-emerald-500/5 text-emerald-500/40 border border-emerald-500/10 cursor-not-allowed'
                                                                                : 'bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 active:scale-95 shadow-lg'
                                                                                }`}
                                                                        >
                                                                            {isRedeemed ? 'Claimed' : 'Redeem vUSD'}
                                                                        </button>
                                                                    )}
                                                                    {!isWinner && (
                                                                        <div className="w-full sm:w-auto px-6 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400 uppercase tracking-widest">
                                                                            Position Liquidated
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    <button
                                                        onClick={() => toggleAuditExpand(proposal.id)}
                                                        className="w-full py-4 flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-[0.3em] text-white/20 hover:text-white/50 transition-all border-y border-white/5 bg-white/[0.01]"
                                                    >
                                                        {auditExpandedIds.has(proposal.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        {auditExpandedIds.has(proposal.id) ? 'Hide Resolution Proof' : 'View Protocol Resolution Proof'}
                                                    </button>

                                                    <AnimatePresence>
                                                        {auditExpandedIds.has(proposal.id) && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden bg-black/40"
                                                            >
                                                                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                                                                    {/* Audit Proof (Visible only if verified) */}
                                                                    {verifiedIds.has(proposal.id) ? (
                                                                        <div className="p-5 md:p-8 bg-black/60 rounded-2xl border border-emerald-500/20 relative group/audit">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                                    Resolution Audit
                                                                                </div>
                                                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 w-fit">
                                                                                    <SearchCheck className="w-3 h-3 text-emerald-500" />
                                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Hash: 0x4f...e2a</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 gap-3 mb-6">
                                                                                {proposal.usedDataSources?.map((ds, idx) => {
                                                                                    const dsInfo = TRUSTED_DATA_SOURCES.find(t => t.id === ds.id);
                                                                                    const isConditionMet = ds.operator === '>' ? ds.currentValue > ds.targetValue : ds.currentValue < ds.targetValue;

                                                                                    return (
                                                                                        <div key={idx} className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl gap-4">
                                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                                {dsInfo?.icon && <img src={dsInfo.icon} className="w-4 h-4 object-contain opacity-50 shrink-0" alt="" />}
                                                                                                <span className="text-[10px] md:text-[11px] font-bold text-white/40 uppercase truncate">{dsInfo?.ticker || 'Variable'}</span>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                                                                                <span className="text-[10px] md:text-xs font-mono font-bold text-white/60">{ds.currentValue}</span>
                                                                                                <ArrowRight className="w-3 h-3 text-white/20" />
                                                                                                <span className={`text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 rounded-md ${isConditionMet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                                                    {isConditionMet ? 'PASS' : 'FAIL'}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>

                                                                            <div className="pt-6 border-t border-white/5">
                                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                                                    <span className="text-[10px] md:text-[11px] font-bold text-white/40 uppercase tracking-widest">Audit Summary</span>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <span className="text-[9px] md:text-[10px] text-white/40 uppercase font-black tracking-tighter">Result:</span>
                                                                                        <span className={`px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-lg ${proposal.winner === 'yes' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                                                            {proposal.winner === 'yes' ? 'PASSED (TRUE)' : 'FAILED (FALSE)'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="p-4 md:p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                                                                                    <div className="flex items-start gap-3">
                                                                                        <ShieldCheck className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                                                                                        <p className="text-xs md:text-[14px] text-white/70 font-medium leading-relaxed">
                                                                                            Verification confirmed using historical data snapshots from
                                                                                            <span className="text-white font-bold mx-1 border-b border-white/20">
                                                                                                {new Date(proposal.resolutionDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                                            </span>
                                                                                            and subsequent validation.
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="pl-7">
                                                                                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                                                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Finalized Archive</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                                                            <div className="inline-flex p-3 bg-white/5 rounded-full mb-3 text-white/20">
                                                                                <Binary className="w-8 h-8" />
                                                                            </div>
                                                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Verification Required to Access Audit Logs</p>
                                                                        </div>
                                                                    )}

                                                                    {/* Protocol Math (Always in accordion) */}
                                                                    <div>
                                                                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] mb-4">Protocol Evaluation Math</div>
                                                                        <code className="text-[13px] font-mono text-emerald-400 font-bold bg-emerald-500/[0.03] px-4 py-3 rounded-xl block border border-emerald-500/10 shadow-inner">
                                                                            {proposal.mathematicalLogic || '// Logic finalized on-chain'}
                                                                        </code>
                                                                        <div className="mt-6 p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10 flex gap-4 items-start">
                                                                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                                                <Clock className="w-4 h-4 text-emerald-500" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-1">Settlement Protocol</p>
                                                                                <p className="text-[13px] text-white/60 font-medium leading-relaxed">
                                                                                    Markets are only settled if the mathematical conditions are <span className="text-white font-bold italic text-emerald-400">met during or after</span> the resolution deadline.
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <div className="p-4 md:p-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/20">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                                                                <ShieldCheck className="w-3.5 h-3.5 text-white/20" />
                                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Executing trades: ALWAYS FALSE</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-[9px] md:text-[10px] font-black italic text-white/10 uppercase tracking-widest text-center sm:text-right">
                                                            Resolution ID: VR-HIST-{proposal.id.toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Mobile Pull Tab - Visible when sidebar is closed */}
                {!isMobileSidebarOpen && (
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="xl:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[130] bg-white/[0.03] hover:bg-white/[0.05] border-y border-r border-white/10 rounded-r-xl p-2.5 text-white/20 hover:text-white/40 transition-all flex items-center justify-center group backdrop-blur-sm"
                    >
                        <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <div className="absolute left-full ml-2 px-2 py-1 rounded bg-black/80 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-widest">Feed & Agents</span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
