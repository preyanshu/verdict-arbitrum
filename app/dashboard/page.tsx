"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { ActiveAgents } from "@/components/dashboard/ActiveAgents";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { SlidersHorizontal, Search, LayoutGrid, ChevronDown, Activity, ChevronRight, Plus } from "lucide-react";
import { MarketStatus } from "@/components/dashboard/MarketStatus";
import { MarketCard } from "@/components/dashboard/MarketCard";
import { MarketState, Agent, MarketStrategy } from "@/lib/types";
import { MarketDetailView } from "@/components/dashboard/MarketDetailView";
import { CreateProposalModal } from "@/components/dashboard/CreateProposalModal";
import { AnimatePresence, motion } from "framer-motion";


const MS_PER_DAY = 24 * 60 * 60 * 1000;
const INITIAL_TOKEN_RESERVE = 1000;

export default function DashboardPage() {
    const [now, setNow] = useState(Date.now());
    const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

    const marketStateData = {
        "strategies": [
            {
                "id": "strategy-1",
                "name": "S&P and Tech ETF Bull Run",
                "description": "The SPDR S&P 500 ETF Trust (SPY) will exceed 705 AND the Invesco QQQ Trust (QQQ) will exceed 635.",
                "evaluationLogic": "(SPY > 705 AND QQQ > 635)",
                "mathematicalLogic": "(asset_SPY_price > 705 AND asset_QQQ_price > 635)",
                "usedDataSources": [
                    {
                        "id": 12245,
                        "currentValue": 695.15997,
                        "targetValue": 705,
                        "operator": ">"
                    },
                    {
                        "id": 12249,
                        "currentValue": 627.19,
                        "targetValue": 635,
                        "operator": ">"
                    }
                ],
                "resolutionDeadline": 1770906112316,
                "yesToken": {
                    "tokenReserve": 2150,
                    "volume": 24500,
                    "history": [
                        { "price": 0.48, "timestamp": 1768310012316 },
                        { "price": 0.49, "timestamp": 1768311012316 },
                        { "price": 0.51, "timestamp": 1768312012316 },
                        { "price": 0.50, "timestamp": 1768313012316 },
                        { "price": 0.52, "timestamp": 1768314112316 }
                    ],
                    "twap": 0.502,
                    "twapHistory": [
                        { "twap": 0.48, "timestamp": 1768310012316 },
                        { "twap": 0.485, "timestamp": 1768311012316 },
                        { "twap": 0.49, "timestamp": 1768312012316 },
                        { "twap": 0.495, "timestamp": 1768313012316 },
                        { "twap": 0.502, "timestamp": 1768314112316 }
                    ]
                },
                "noToken": {
                    "tokenReserve": 1850,
                    "volume": 12200,
                    "history": [
                        { "price": 0.52, "timestamp": 1768310012316 },
                        { "price": 0.51, "timestamp": 1768311012316 },
                        { "price": 0.49, "timestamp": 1768312012316 },
                        { "price": 0.50, "timestamp": 1768313012316 },
                        { "price": 0.48, "timestamp": 1768314112316 }
                    ],
                    "twap": 0.498,
                    "twapHistory": [
                        { "twap": 0.52, "timestamp": 1768310012316 },
                        { "twap": 0.515, "timestamp": 1768311012316 },
                        { "twap": 0.51, "timestamp": 1768312012316 },
                        { "twap": 0.505, "timestamp": 1768313012316 },
                        { "twap": 0.498, "timestamp": 1768314112316 }
                    ]
                },
                "timestamp": 1768314112316,
                "resolved": false,
                "winner": null
            },
            {
                "id": "strategy-2",
                "name": "Commodity Oil Market Surge",
                "description": "WTI Crude Oil will exceed 62 USD per barrel OR Brent Oil will exceed 66 USD per barrel.",
                "evaluationLogic": "(WTI > 62 OR XBR > 66)",
                "mathematicalLogic": "(asset_WTI_price > 62 OR asset_XBR_price > 66)",
                "usedDataSources": [
                    {
                        "id": 12288,
                        "currentValue": 60.12,
                        "targetValue": 62,
                        "operator": ">"
                    },
                    {
                        "id": 12286,
                        "currentValue": 64.29,
                        "targetValue": 66,
                        "operator": ">"
                    }
                ],
                "resolutionDeadline": 1769523712316,
                "yesToken": {
                    "tokenReserve": 2000,
                    "volume": 0,
                    "history": [{ "price": 0.5, "timestamp": 1768314112316 }],
                    "twap": 0.5,
                    "twapHistory": [{ "twap": 0.5, "timestamp": 1768314112316 }]
                },
                "noToken": {
                    "tokenReserve": 2000,
                    "volume": 0,
                    "history": [{ "price": 0.5, "timestamp": 1768314112316 }],
                    "twap": 0.5,
                    "twapHistory": [{ "twap": 0.5, "timestamp": 1768314112316 }]
                },
                "timestamp": 1768314112316,
                "resolved": false,
                "winner": null
            },
            {
                "id": "strategy-4",
                "name": "Energy and Broad Market Downturn",
                "description": "Natural Gas (NG) will fall below 3.30 USD per MMBtu OR the SPDR S&P 500 ETF Trust (SPY) will fall below 690.",
                "evaluationLogic": "(NG < 3.30 OR SPY < 690)",
                "mathematicalLogic": "(asset_NG_price < 3.30 OR asset_SPY_price < 690)",
                "usedDataSources": [
                    {
                        "id": 12292,
                        "currentValue": 3.3624,
                        "targetValue": 3.3,
                        "operator": "<"
                    },
                    {
                        "id": 12245,
                        "currentValue": 695.15997,
                        "targetValue": 690,
                        "operator": "<"
                    }
                ],
                "resolutionDeadline": 1768918912316,
                "yesToken": {
                    "tokenReserve": 2000,
                    "volume": 0,
                    "history": [{ "price": 0.5, "timestamp": 1768314112316 }],
                    "twap": 0.5,
                    "twapHistory": [{ "twap": 0.5, "timestamp": 1768314112316 }]
                },
                "noToken": {
                    "tokenReserve": 2000,
                    "volume": 0,
                    "history": [{ "price": 0.5, "timestamp": 1768314112316 }],
                    "twap": 0.5,
                    "twapHistory": [{ "twap": 0.5, "timestamp": 1768314112316 }]
                },
                "timestamp": 1768314112316,
                "resolved": false,
                "winner": null
            },
            {
                "id": "strategy-5",
                "name": "Global Market and FX Strength",
                "description": "The Vanguard S&P 500 ETF (VOO) will exceed 645 AND the Canadian Dollar (CAD) will exceed 0.725 against the USD.",
                "evaluationLogic": "(VOO > 645 AND CAD > 0.725)",
                "mathematicalLogic": "(asset_VOO_price > 645 AND asset_CAD_price > 0.725)",
                "usedDataSources": [
                    {
                        "id": 12243,
                        "currentValue": 639.29999,
                        "targetValue": 645,
                        "operator": ">"
                    },
                    {
                        "id": 12283,
                        "currentValue": 0.721001326642441,
                        "targetValue": 0.725,
                        "operator": ">"
                    }
                ],
                "resolutionDeadline": 1770128512316,
                "yesToken": {
                    "tokenReserve": 2000,
                    "volume": 0,
                    "history": [{ "price": 0.5, "timestamp": 1768314112316 }],
                    "twap": 0.5,
                    "twapHistory": [{ "twap": 0.5, "timestamp": 1768314112316 }]
                },
                "noToken": {
                    "tokenReserve": 2000,
                    "volume": 0,
                    "history": [{ "price": 0.5, "timestamp": 1768314112316 }],
                    "twap": 0.5,
                    "twapHistory": [{ "twap": 0.5, "timestamp": 1768314112316 }]
                },
                "timestamp": 1768314112316,
                "resolved": false,
                "winner": null
            }
        ],
        "timestamp": 1768314112316,
        "roundNumber": 0,
        "roundStartTime": 1768314112316,
        "roundEndTime": 1768315012316,
        "roundDuration": 60000,
        "roundsUntilResolution": 1,
        "lastRoundEndTime": null,
        "isExecutingTrades": false,
        "isMakingBatchLLMCall": false
    };

    const agents: Agent[] = [
        {
            "id": "agent-1",
            "personality": {
                "name": "Capital Guardian",
                "riskTolerance": "low",
                "aggressiveness": 0.2,
                "memo": "I prioritize the preservation of capital above all else. My strategy involves meticulous fundamental analysis, identifying undervalued assets with strong long-term growth potential. I avoid speculative plays and extreme market volatility, patiently waiting for optimal entry points and holding for extended periods. My goal is steady, sustainable wealth accumulation over time.",
                "traits": [
                    "patient",
                    "prudent",
                    "fundamentalist",
                    "long-term focused",
                    "defensive"
                ]
            },
            "strategy": "yes-no" as any,
            "vUSD": 109,
            "tokenHoldings": [
                {
                    "strategyId": "strategy-2",
                    "tokenType": "yes",
                    "quantity": 0.9504950495049798
                }
            ],
            "trades": [
                {
                    "type": "buy",
                    "strategyId": "strategy-2",
                    "tokenType": "yes",
                    "price": 0.502481374299612,
                    "quantity": 19.95049504950498,
                    "timestamp": 1768315545716,
                    "reasoning": "I'm focusing on the Commodity Oil Market Surge. WTI crude is currently close to its target, and the 'OR' condition provides a higher probability of success for my low-risk strategy."
                },
                {
                    "type": "sell",
                    "strategyId": "strategy-2",
                    "tokenType": "yes",
                    "price": 0.4977325131191996,
                    "quantity": 19,
                    "timestamp": 1768315597662,
                    "reasoning": "With only 10 seconds left, WTI and Brent are both below the target thresholds. To maximize profit and manage my low risk, I am selling my YES tokens to cut potential losses."
                }
            ],
            "roundMemory": [
                {
                    "action": "sell" as any,
                    "strategyId": "strategy-2",
                    "tokenType": "yes",
                    "quantity": 19,
                    "price": 0.502481374299612,
                    "reasoning": "With only 10 seconds left, WTI and Brent are both below the target thresholds. To maximize profit and manage my low risk, I am selling my YES tokens to cut potential losses.",
                    "timestamp": 1768315574005
                }
            ],
            "totalValue": 109.47309228969748
        },
        {
            "id": "agent-2",
            "personality": {
                "name": "Market Navigator",
                "riskTolerance": "medium",
                "aggressiveness": 0.5,
                "memo": "I am a balanced explorer of the markets, always seeking a sensible equilibrium between risk and reward. My approach combines both fundamental insights with technical analysis to identify emerging trends and value opportunities. I am adaptable, willing to adjust my positions based on market shifts, but always with a disciplined stop-loss strategy in place. I believe in diversified portfolios to mitigate unforeseen challenges.",
                "traits": [
                    "adaptable",
                    "balanced",
                    "disciplined",
                    "opportunistic",
                    "diversified"
                ]
            },
            "strategy": "yes-no" as any,
            "vUSD": 124,
            "tokenHoldings": [
                {
                    "strategyId": "strategy-3",
                    "tokenType": "yes",
                    "quantity": 0.6951219512195621
                }
            ],
            "trades": [
                {
                    "type": "buy",
                    "strategyId": "strategy-3",
                    "tokenType": "yes",
                    "price": 0.5061347384267971,
                    "quantity": 49.69512195121956,
                    "timestamp": 1768315547798,
                    "reasoning": "I am looking at Digital Gold and Bond Stability. IBIT is very close to its target, making this an appealing moderate-risk opportunity for potential growth."
                },
                {
                    "type": "sell",
                    "strategyId": "strategy-3",
                    "tokenType": "yes",
                    "price": 0.49388689593865337,
                    "quantity": 49,
                    "timestamp": 1768315600989,
                    "reasoning": "Given the current prices of IBIT and TLT are below their targets and only 10 seconds remain, it is prudent to sell my YES tokens to prevent further losses and secure my remaining capital."
                }
            ],
            "roundMemory": [
                {
                    "action": "sell" as any,
                    "strategyId": "strategy-3",
                    "tokenType": "yes",
                    "quantity": 49,
                    "price": 0.5061347384267971,
                    "reasoning": "Given the current prices of IBIT and TLT are below their targets and only 10 seconds remain, it is prudent to sell my YES tokens to prevent further losses and secure my remaining capital.",
                    "timestamp": 1768315574005
                }
            ],
            "totalValue": 124.34331162278664
        },
        {
            "id": "agent-3",
            "personality": {
                "name": "Velocity Trader",
                "riskTolerance": "high",
                "aggressiveness": 0.9,
                "memo": "I thrive on dynamism and velocity in the market. My core philosophy is to aggressively pursue high-growth opportunities, often leveraging market momentum and short-term trends. I am prepared to take significant calculated risks for outsized returns, believing that rapid execution and a willingness to cut losses quickly are paramount. I am always on the hunt for the next big move.",
                "traits": [
                    "bold",
                    "decisive",
                    "momentum-driven",
                    "risk-taker",
                    "high-frequency capable"
                ]
            },
            "strategy": "yes-no" as any,
            "vUSD": 148,
            "tokenHoldings": [
                {
                    "strategyId": "strategy-1",
                    "tokenType": "yes",
                    "quantity": 0.8095238095238528
                }
            ],
            "trades": [
                {
                    "type": "buy",
                    "strategyId": "strategy-1",
                    "tokenType": "yes",
                    "price": 0.5120464441219158,
                    "quantity": 98.80952380952385,
                    "timestamp": 1768315551593,
                    "reasoning": "I believe in a strong S&P and Tech ETF Bull Run. Despite current levels, my high-risk tolerance and aggressive approach make me confident in a significant market upswing."
                },
                {
                    "type": "sell",
                    "strategyId": "strategy-1",
                    "tokenType": "yes",
                    "price": 0.48755128462211356,
                    "quantity": 98,
                    "timestamp": 1768315605498,
                    "reasoning": "Despite my high-risk tolerance, SPY and QQQ are significantly below their targets with mere seconds remaining. To maximize my profit, I must aggressively cut my losses and sell my YES tokens."
                }
            ],
            "roundMemory": [
                {
                    "action": "sell" as any,
                    "strategyId": "strategy-1",
                    "tokenType": "yes",
                    "quantity": 98,
                    "price": 0.5120464441219158,
                    "reasoning": "Despite my high-risk tolerance, SPY and QQQ are significantly below their targets with mere seconds remaining. To maximize my profit, I must aggressively cut my losses and sell my YES tokens.",
                    "timestamp": 1768315574005
                }
            ],
            "totalValue": 148.39468437326553
        },
        {
            "id": "agent-4",
            "personality": {
                "name": "Quantum Arbiter",
                "riskTolerance": "medium",
                "aggressiveness": 0.8,
                "memo": "My strategy relies entirely on sophisticated quantitative models and statistical arbitrage to identify and exploit fleeting market inefficiencies. I execute trades with extreme precision and high frequency, aiming for consistent, small gains that accumulate rapidly. I continuously monitor numerous data streams, and my decisions are purely data-driven, with predefined risk thresholds and stop-loss mechanisms embedded in my algorithms. I am a machine of logical market exploitation.",
                "traits": [
                    "systematic",
                    "algorithmic",
                    "high-frequency",
                    "data-driven",
                    "arbitrageur"
                ]
            },
            "strategy": "yes-no" as any,
            "vUSD": 139,
            "tokenHoldings": [
                {
                    "strategyId": "strategy-5",
                    "tokenType": "yes",
                    "quantity": 0.23076923076928324
                }
            ],
            "trades": [
                {
                    "type": "buy",
                    "strategyId": "strategy-5",
                    "tokenType": "yes",
                    "price": 0.5097078228086711,
                    "quantity": 79.23076923076928,
                    "timestamp": 1768315569157,
                    "reasoning": "I'm observing the Global Market and FX Strength proposal. The Canadian Dollar is close to its target, and I see potential for VOO to follow suit, aligning with my moderately aggressive approach."
                },
                {
                    "type": "sell",
                    "strategyId": "strategy-5",
                    "tokenType": "yes",
                    "price": 0.4899588571316721,
                    "quantity": 79,
                    "timestamp": 1768315618719,
                    "reasoning": "VOO and CAD are both below their thresholds, and with only 10 seconds on the clock, a turnaround is highly improbable. I'm selling my YES tokens to manage risk and protect my capital."
                }
            ],
            "roundMemory": [
                {
                    "action": "sell" as any,
                    "strategyId": "strategy-5",
                    "tokenType": "yes",
                    "quantity": 79,
                    "price": 0.5097078228086711,
                    "reasoning": "VOO and CAD are both below their thresholds, and with only 10 seconds on the clock, a turnaround is highly improbable. I'm selling my YES tokens to manage risk and protect my capital.",
                    "timestamp": 1768315574005
                }
            ],
            "totalValue": 139.11306742856888
        }
    ];

    const marketState: MarketState = marketStateData as MarketState;
    const strategies = marketState.strategies;
    const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

    return (
        <div className="h-screen bg-[#08080c] text-white selection:bg-white selection:text-black overflow-hidden flex flex-col relative">
            <Navbar transparent={false} />

            {/* Subtle Monochrome Decorative Elements */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] -z-10" />

            {/* Main Content Split Area */}
            <div className="flex flex-1 pt-20 relative z-10 overflow-hidden">
                {/* Sidebar Overlay for Mobile/Tablet */}
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
                                className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-[#08080c] border-r border-white/10 z-[150] xl:hidden flex flex-col overflow-hidden shadow-2xl"
                            >
                                <div className="flex items-center justify-between p-6 border-b border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Intelligence</span>
                                        <span className="text-sm font-bold text-white uppercase tracking-tight">System Feed</span>
                                    </div>
                                    <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                                        <ChevronDown className="w-5 h-5 rotate-90" />
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex-[2] overflow-y-auto custom-scrollbar">
                                        <ActivityFeed agents={agents} filterStrategyId={selectedStrategyId} activeProposalName={selectedStrategy?.name} />
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <ActiveAgents agents={agents} />
                                    </div>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Left Sidebar - Visible on desktops */}
                <aside
                    style={{ width: `${sidebarWidth}px`, minWidth: '300px' }}
                    className="hidden xl:flex relative bg-[#08080c] border-r border-white/5 flex-col h-full flex-shrink-0 overflow-hidden"
                >
                    <div style={{ height: `${topPanelHeight}%` }} className="overflow-y-auto custom-scrollbar">
                        <ActivityFeed
                            agents={agents}
                            filterStrategyId={selectedStrategyId}
                            activeProposalName={selectedStrategy?.name}
                        />
                    </div>

                    {/* Horizontal Resizer (Vertical Resize Handle) */}
                    <div
                        onMouseDown={() => setIsResizingValue('vertical')}
                        className="h-1.5 w-full bg-white/5 cursor-row-resize hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors flex items-center justify-center group relative z-50 flex-shrink-0"
                    >
                        <div className="w-12 h-1 rounded-full bg-white/10 group-hover:bg-emerald-500/30 transition-colors" />
                    </div>

                    <div style={{ height: `${100 - topPanelHeight}%` }} className="overflow-y-auto custom-scrollbar">
                        <ActiveAgents agents={agents} />
                    </div>

                    {/* Vertical Resizer Handle */}
                    <div
                        onMouseDown={() => setIsResizingValue('horizontal')}
                        className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors z-50"
                    />
                </aside>

                {/* Mobile Pull Tab - Visible when sidebar is closed */}
                {!isMobileSidebarOpen && (
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="xl:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[130] bg-white/[0.03] hover:bg-white/[0.05] border-y border-r border-white/10 rounded-r-xl p-2.5 text-white/20 hover:text-white/40 transition-all flex items-center justify-center group backdrop-blur-sm"
                    >
                        <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <div className="absolute left-full ml-2 px-2 py-1 rounded bg-black/80 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-widest">Intelligence Feed</span>
                        </div>
                    </button>
                )}

                {/* Right Side: Active Agents Detailed View */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050507] px-3 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-10">
                    <AnimatePresence mode="wait">
                        {!selectedStrategy ? (
                            <div key="grid">
                                {/* Header */}
                                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 md:mb-12">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-1 md:mb-2 uppercase leading-none">
                                            Quantum Markets
                                        </h1>
                                        <p className="text-white/40 font-medium text-[10px] sm:text-sm md:text-lg uppercase tracking-widest truncate">Autonomous Strategic Evaluation</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-400 hover:text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                        >
                                            <Plus className="w-4 h-4 text-emerald-600" />
                                            Launch Proposal
                                        </button>
                                    </div>
                                </header>

                                {/* Header Controls */}
                                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 mb-8 md:mb-12">
                                    <div className="flex-1 relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/20 group-focus-within:text-emerald-500/50 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search markets..."
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl py-2.5 md:py-3.5 pl-10 md:pl-12 pr-4 text-sm md:text-base font-medium focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-white/20"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl">
                                        <button
                                            onClick={() => setSortBy('newest')}
                                            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all ${sortBy === 'newest'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                : 'text-white/40 hover:text-white/60'
                                                }`}
                                        >
                                            Newest
                                        </button>
                                        <button
                                            onClick={() => setSortBy('twap')}
                                            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all ${sortBy === 'twap'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                : 'text-white/40 hover:text-white/60'
                                                }`}
                                        >
                                            TWAP
                                        </button>
                                    </div>
                                </div>

                                <MarketStatus state={marketState} agentCount={agents.length} />

                                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 mt-8">
                                    {strategies.map((strategy) => (
                                        <MarketCard
                                            key={strategy.id}
                                            strategy={strategy}
                                            onClick={(id) => setSelectedStrategyId(id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <MarketDetailView
                                key="detail"
                                strategy={selectedStrategy}
                                onBack={() => setSelectedStrategyId(null)}
                            />
                        )}
                    </AnimatePresence>
                </main>
            </div>
            <CreateProposalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                activeAgentsCount={agents.length}
                currentProposalsCount={strategies.length}
            />
        </div>
    );
}
