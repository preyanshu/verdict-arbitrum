"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { ActiveAgents } from "@/components/dashboard/ActiveAgents";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { SlidersHorizontal, Search, LayoutGrid, ChevronDown, Activity, ChevronRight, Plus, ArrowRight, Loader2, FileText, Brain, Zap, Check, ChevronLeft, List, X } from "lucide-react";
import { MarketStatus } from "@/components/dashboard/MarketStatus";
import { MarketCard } from "@/components/dashboard/MarketCard";
import { MarketState, Agent, MarketStrategy } from "@/lib/types";
import { MarketDetailView } from "@/components/dashboard/MarketDetailView";
import { CreateProposalModal } from "@/components/dashboard/CreateProposalModal";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";


const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function DashboardPage() {
    const [now, setNow] = useState(Date.now());
    const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
    const [isStep1Loading, setIsStep1Loading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Dynamic sidebar width based on screen size
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [topPanelHeight, setTopPanelHeight] = useState(70);
    const [sortBy, setSortBy] = useState<'newest' | 'twap'>('newest');
    const [isResizingValue, setIsResizingValue] = useState<'none' | 'vertical' | 'horizontal'>('none');

    useEffect(() => {
        const updateWidth = () => {
            if (window.innerWidth < 1536 && window.innerWidth >= 1280) {
                setSidebarWidth(350); // Narrower on smaller desktops
            } else if (window.innerWidth >= 1536) {
                setSidebarWidth(450); // Standard on desktop
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingValue === 'none') return;

            if (isResizingValue === 'horizontal') {
                const w = e.clientX;
                if (w >= 350 && w <= 700) setSidebarWidth(w);
            } else if (isResizingValue === 'vertical') {
                const h = ((e.clientY - 80) / (window.innerHeight - 80)) * 100;
                if (h > 20 && h < 80) setTopPanelHeight(h);
            }
        };

        const handleMouseUp = () => setIsResizingValue('none');

        if (isResizingValue !== 'none') {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = isResizingValue === 'horizontal' ? 'col-resize' : 'row-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizingValue]);

    const [marketState, setMarketState] = useState<MarketState | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [strategies, setStrategies] = useState<MarketStrategy[]>([]);
    const [isOptimisticExecuting, setIsOptimisticExecuting] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [userTrades, setUserTrades] = useState<any[]>([]);
    const statusHoldCounter = useRef(0);
    const wasExecuting = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [state, fetchedAgents] = await Promise.all([
                    api.getMarketState(),
                    api.getAgents()
                ]);
                setStrategies(state.strategies);
                setAgents(fetchedAgents);

                // Handle status transition debounce (hold 'Executing' for 3 polls)
                if (state.isExecutingTrades) {
                    setIsOptimisticExecuting(false);
                    statusHoldCounter.current = 0;
                    wasExecuting.current = true;
                    setMarketState(state);
                } else if (wasExecuting.current) {
                    if (statusHoldCounter.current < 3) {
                        statusHoldCounter.current += 1;
                        setIsOptimisticExecuting(true);
                        setMarketState(state);
                    } else {
                        setIsOptimisticExecuting(false);
                        wasExecuting.current = false;
                        statusHoldCounter.current = 0;
                        setMarketState(state);
                    }
                } else {
                    setMarketState(state);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleUserTrade = (trade: any) => {
        setUserTrades(prev => [trade, ...prev]);
    };

    const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

    const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);

    const handleOnboardingStep = async (step: 1 | 2 | 3) => {
        setIsOnboardingLoading(true);
        const minStepTime = 2000;
        const confirmTime = 1000;
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            if (step === 1) {
                await Promise.all([api.initProposals(), wait(minStepTime)]);
                await wait(confirmTime);
                setOnboardingStep(2);
            } else if (step === 2) {
                await Promise.all([api.initAgents(), wait(minStepTime)]);
                await wait(confirmTime);
                setOnboardingStep(3);
            } else if (step === 3) {
                await Promise.all([api.startTradeLoop(), wait(minStepTime)]);
                await wait(confirmTime);
                // Switch to dashboard immediately after confirmation
                setIsOptimisticExecuting(true);
                setOnboardingStep(1);
                return; // Exit early to avoid finally block resetting loading visibly
            }
        } catch (error) {
            console.error(`Onboarding step ${step} failed:`, error);
        } finally {
            setIsOnboardingLoading(false);
        }
    };

    const filteredStrategies = (strategies || [])
        .filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'newest') return 0;
            if (sortBy === 'twap') {
                const aTwap = (a.yesToken.twap + a.noToken.twap) / 2;
                const bTwap = (b.yesToken.twap + b.noToken.twap) / 2;
                return bTwap - aTwap;
            }
            return 0;
        });

    return (
        <div className="h-screen bg-[#050507] text-white selection:bg-white selection:text-black overflow-hidden flex flex-col relative">
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
                                            <ActivityFeed
                                                agents={agents}
                                                userTrades={userTrades}
                                            />
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

                {/* Left Sidebar */}
                <aside
                    style={{ width: `${sidebarWidth}px`, minWidth: '300px' }}
                    className="hidden xl:flex relative bg-[#121214]/60 backdrop-blur-xl border-r border-white/5 flex-col h-full flex-shrink-0 overflow-hidden"
                >
                    <div style={{ height: `${topPanelHeight}%` }} className="overflow-y-auto custom-scrollbar">
                        <ActivityFeed
                            agents={agents}
                            userTrades={userTrades}
                        />
                    </div>
                    <div onMouseDown={() => setIsResizingValue('vertical')} className="h-1.5 w-full bg-white/5 cursor-row-resize hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors flex items-center justify-center group relative z-50 flex-shrink-0">
                        <div className="w-12 h-1 rounded-full bg-white/10 group-hover:bg-emerald-500/30 transition-colors" />
                    </div>
                    <div style={{ height: `${100 - topPanelHeight}%` }} className="overflow-y-auto custom-scrollbar">
                        <ActiveAgents agents={agents} />
                    </div>
                    <div onMouseDown={() => setIsResizingValue('horizontal')} className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors z-50" />
                </aside>

                {/* Mobile Pull Tab */}
                {!isMobileSidebarOpen && (
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="xl:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[130] bg-white/[0.03] hover:bg-white/[0.05] border-y border-r border-white/10 rounded-r-xl p-2.5 text-white/20 hover:text-white/40 transition-all flex items-center justify-center group backdrop-blur-sm"
                    >
                        <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050507] px-3 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-10 relative">
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
                                        Synchronizing
                                    </span>
                                </div>
                            </motion.div>
                        ) : selectedStrategy ? (
                            <MarketDetailView
                                key="detail"
                                strategy={selectedStrategy}
                                onBack={() => setSelectedStrategyId(null)}
                                isMarketActive={marketState?.isExecutingTrades || isOptimisticExecuting}
                                onTradeSuccess={handleUserTrade}
                            />
                        ) : (
                            <div key="grid">
                                {(!isOnboardingLoading && onboardingStep === 1 && strategies.length > 0) ? (
                                    <>
                                        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 md:mb-12">
                                            <div>
                                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-1 md:mb-2 uppercase leading-none">
                                                    Quantum Markets
                                                </h1>
                                                <p className="text-white/40 font-medium text-[10px] sm:text-sm md:text-lg uppercase tracking-widest truncate">Autonomous Strategic Evaluation</p>
                                            </div>

                                            <button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                disabled={marketState?.isExecutingTrades || marketState?.isMakingBatchLLMCall || strategies.length === 0}
                                                className={`flex items-center gap-2 px-6 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-full transition-all duration-300 shadow-xl
                                                    ${(marketState?.isExecutingTrades || isOptimisticExecuting)
                                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                                        : 'bg-white text-black hover:bg-white/90 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)]'}
                                                    disabled:cursor-not-allowed
                                                `}
                                            >
                                                {marketState?.isMakingBatchLLMCall ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Launching</span></>
                                                ) : (marketState?.isExecutingTrades || isOptimisticExecuting) ? (
                                                    <>
                                                        <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                                                        <span className="mt-0.5">Round Active</span>
                                                    </>
                                                ) : (
                                                    <><Plus className="w-3.5 h-3.5" /><span className="mt-0.5">Launch Agents</span></>
                                                )}
                                            </button>
                                        </header>

                                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 text-white/20" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search markets..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full bg-[#121214]/60 backdrop-blur-xl border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-white/10 transition-all placeholder:text-white/20"
                                                />
                                            </div>

                                            <div className="flex bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-1 rounded-xl shrink-0">
                                                <button
                                                    onClick={() => setSortBy('newest')}
                                                    className={`px-8 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-emerald-500/10 text-emerald-500' : 'text-white/20 hover:text-white/40'}`}
                                                >
                                                    Newest
                                                </button>
                                                <button
                                                    onClick={() => setSortBy('twap')}
                                                    className={`px-8 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${sortBy === 'twap' ? 'bg-emerald-500/10 text-emerald-500' : 'text-white/20 hover:text-white/40'}`}
                                                >
                                                    TWAP
                                                </button>
                                            </div>
                                        </div>

                                        {marketState && <MarketStatus state={marketState} agentCount={agents.length} now={now} forceExecuting={isOptimisticExecuting} />}

                                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 mt-8">
                                            {filteredStrategies.map((strategy) => (
                                                <MarketCard key={strategy.id} strategy={strategy} onClick={(id) => setSelectedStrategyId(id)} />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    /* ONBOARDING GUIDE / NO MARKET STATE */
                                    <div className="mt-8 flex flex-col items-center w-full">
                                        <div className="w-full max-w-6xl">
                                            <div className="mb-16 text-center relative">
                                                {strategies.length > 0 && !isOnboardingLoading && (
                                                    <button
                                                        onClick={() => setOnboardingStep(1)}
                                                        className="absolute -top-4 right-0 p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all group lg:-right-4"
                                                        title="Exit Walkthrough"
                                                    >
                                                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                                    </button>
                                                )}
                                                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">No Active Market</h2>
                                                <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-6">Market Initialization Guide</p>

                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="flex items-center justify-center gap-3 py-3 px-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 w-fit mx-auto"
                                                >
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Looking for settled markets?</span>
                                                    <Link href="/dashboard/history" className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group">
                                                        View Graduated Proposals <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                    </Link>
                                                </motion.div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                                                <div className="hidden md:block absolute top-1/3 left-0 w-full h-px bg-white/5 -z-10" />

                                                {/* Step 1 */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`group relative p-8 rounded-[40px] border transition-all duration-500 flex flex-col items-center text-center ${onboardingStep === 1 ? 'bg-white/[0.04] border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.02)]' : 'bg-transparent border-white/5 opacity-40'}`}
                                                >
                                                    <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 transition-all duration-500 ${onboardingStep === 1 ? 'bg-white text-black shadow-2xl scale-110' : 'bg-white/5 text-white/20'}`}>
                                                        <FileText className="w-9 h-9" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${onboardingStep === 1 ? 'text-emerald-500' : 'text-white/20'}`}>Protocol Step 01</span>
                                                        {onboardingStep > 1 && <Check className="w-4 h-4 text-emerald-500" />}
                                                    </div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">Generate Proposal</h3>
                                                    <p className="text-sm font-medium text-white/40 leading-relaxed mb-10 min-h-[60px]">Define your custom market parameters and automated resolution logic.</p>
                                                    {onboardingStep === 1 && (
                                                        <button
                                                            onClick={() => handleOnboardingStep(1)}
                                                            disabled={isOnboardingLoading}
                                                            className="group/btn relative w-full flex items-center justify-center gap-4 px-8 py-5 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50 disabled:scale-100"
                                                        >
                                                            {isOnboardingLoading ? (
                                                                <><Loader2 className="w-4 h-4 animate-spin" /><span>Generating...</span></>
                                                            ) : (
                                                                <><span className="mt-0.5">Generate Proposal</span><ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>
                                                            )}
                                                        </button>
                                                    )}
                                                </motion.div>

                                                {/* Step 2 */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    className={`relative p-8 rounded-[40px] border transition-all duration-500 flex flex-col items-center text-center ${onboardingStep === 2 ? 'bg-emerald-500/[0.03] border-emerald-500/30' : 'bg-transparent border-white/10 opacity-40'}`}
                                                >
                                                    <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 transition-all duration-500 ${onboardingStep === 2 ? 'bg-emerald-500 text-black shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-110' : 'bg-white/5 text-white/20'}`}>
                                                        <Brain className="w-9 h-9" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${onboardingStep === 2 ? 'text-emerald-500' : 'text-white/20'}`}>Protocol Step 02</span>
                                                        {onboardingStep > 2 && <Check className="w-4 h-4 text-emerald-500" />}
                                                    </div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">Synthesize Agents</h3>
                                                    <p className="text-sm font-medium text-white/40 leading-relaxed mb-10 min-h-[60px]">The protocol uses LLMs to generate specialized AI behaviors for your market.</p>
                                                    {onboardingStep === 2 && (
                                                        <button
                                                            onClick={() => handleOnboardingStep(2)}
                                                            disabled={isOnboardingLoading}
                                                            className="group/btn relative w-full flex items-center justify-center gap-4 px-8 py-5 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50 disabled:scale-100"
                                                        >
                                                            {isOnboardingLoading ? (
                                                                <><Loader2 className="w-4 h-4 animate-spin" /><span>Synthesizing...</span></>
                                                            ) : (
                                                                <><span className="mt-0.5">Synthesize Agents</span><ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>
                                                            )}
                                                        </button>
                                                    )}
                                                    {onboardingStep < 2 && <div className="w-full py-4 text-white/5 font-black text-[10px] uppercase tracking-widest italic">Awaiting Proposal</div>}
                                                </motion.div>

                                                {/* Step 3 */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className={`relative p-8 rounded-[40px] border transition-all duration-500 flex flex-col items-center text-center ${onboardingStep === 3 ? 'bg-emerald-500/[0.03] border-emerald-500/30' : 'bg-transparent border-white/10 opacity-40'}`}
                                                >
                                                    <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 transition-all duration-500 ${onboardingStep === 3 ? 'bg-emerald-500 text-black shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-110' : 'bg-white/5 text-white/20'}`}>
                                                        <Zap className="w-9 h-9" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${onboardingStep === 3 ? 'text-emerald-500' : 'text-white/20'}`}>Protocol Step 03</span>
                                                    </div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">Orchestrate & Trade</h3>
                                                    <p className="text-sm font-medium text-white/40 leading-relaxed mb-10 min-h-[60px]">Deploying the autonomous trading fleet for synchronized market execution.</p>
                                                    {onboardingStep === 3 && (
                                                        <button
                                                            onClick={() => handleOnboardingStep(3)}
                                                            disabled={isOnboardingLoading}
                                                            className="group/btn relative w-full flex items-center justify-center gap-4 px-8 py-5 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50 disabled:scale-100"
                                                        >
                                                            {isOnboardingLoading ? (
                                                                <><Loader2 className="w-4 h-4 animate-spin" /><span>Orchestrating...</span></>
                                                            ) : (
                                                                <><span className="mt-0.5">Start Trading</span><ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>
                                                            )}
                                                        </button>
                                                    )}
                                                    {onboardingStep < 3 && <div className="w-full py-4 text-white/5 font-black text-[10px] uppercase tracking-widest italic">Awaiting Synthesis</div>}
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            <CreateProposalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onLaunchSuccess={() => {
                    setIsOptimisticExecuting(true);
                }}
                activeAgentsCount={agents.length}
                currentProposalsCount={strategies.length}
                roundEndTime={marketState?.roundEndTime}
                roundDuration={marketState?.roundDuration}
                isExecutingTrades={marketState?.isExecutingTrades}
                now={now}
            />
        </div>
    );
}
