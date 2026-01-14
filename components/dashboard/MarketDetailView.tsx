"use client";

import { useEffect, useRef, useState } from "react";
import { MarketStrategy } from "@/lib/types";
import {
    ArrowLeft,
    ArrowUpRight,
    ArrowRight,
    Database,
    TrendingUp,
    Zap,
    Scale,
    Shield,
    Activity,
    Clock,
    TrendingDown,
    ArrowUpDown,
    Wallet
} from "lucide-react";
import { TRUSTED_DATA_SOURCES } from "@/lib/data-sources";
import { motion, AnimatePresence } from "framer-motion";
import { createChart, ColorType, AreaSeries, LineSeries, UTCTimestamp, ISeriesApi } from "lightweight-charts";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getVUSDCBalance, getYESBalance, getVUSDCTokenAddress, getYesTokenAddress, getSwapQuote, executeSwap, quantumEVM, getAllowance, approveToken, ROUTER_ADDRESS, publicClient } from "@/lib/blockchain";
import { createWalletClient, custom, parseUnits } from "viem";
import { Loader2 } from "lucide-react";

interface MarketDetailViewProps {
    strategy: MarketStrategy;
    onBack: () => void;
    isMarketActive?: boolean;
    onTradeSuccess?: (trade: any) => void;
}

export function MarketDetailView({ strategy, onBack, isMarketActive = false, onTradeSuccess }: MarketDetailViewProps) {
    const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes');
    const [swapAmount, setSwapAmount] = useState<string>("");
    const [isReversed, setIsReversed] = useState(false);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const areaSeriesRef = useRef<any>(null);
    const twapSeriesRef = useRef<any>(null);
    const { user, authenticated, login } = usePrivy();
    const { wallets } = useWallets();

    const [vusdcAddress, setVusdcAddress] = useState<string>("");
    const [yesTokenAddress, setYesTokenAddressState] = useState<string>("");
    const [vusdcBalance, setVusdcBalance] = useState<string>("0.00");
    const [yesBalance, setYesBalance] = useState<string>("0.00");
    const [quoteAmount, setQuoteAmount] = useState<string>("0.00");
    const [isQuoting, setIsQuoting] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentToken = activeTab === 'yes' ? strategy.yesToken : strategy.noToken;
    const yesPrice = strategy.yesToken.history[strategy.yesToken.history.length - 1]?.price ?? 0.5;
    const noPrice = strategy.noToken.history[strategy.noToken.history.length - 1]?.price ?? 0.5;

    // Initial Chart Creation
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#ffffff60',
            },
            grid: {
                vertLines: { color: '#ffffff05' },
                horzLines: { color: '#ffffff05' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                tickMarkFormatter: (time: number) => {
                    const startSeconds = Math.floor(strategy.timestamp / 1000);
                    const relativeSeconds = Math.max(0, time - startSeconds);
                    const mins = Math.floor(relativeSeconds / 60);
                    const secs = relativeSeconds % 60;
                    return `${mins}m ${secs}s`;
                },
            },
            rightPriceScale: {
                borderVisible: false,
            },
        });

        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: activeTab === 'yes' ? '#10b981' : '#ef4444',
            topColor: activeTab === 'yes' ? '#10b98120' : '#ef444420',
            bottomColor: activeTab === 'yes' ? '#10b98105' : '#ef444405',
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 3,
                minMove: 0.001,
            },
        });

        const twapSeries = chart.addSeries(LineSeries, {
            color: '#ffffff30',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            priceFormat: {
                type: 'price',
                precision: 3,
                minMove: 0.001,
            },
        });

        chartRef.current = chart;
        areaSeriesRef.current = areaSeries;
        twapSeriesRef.current = twapSeries;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, []); // Create chart once

    // Reactive Data Updates
    useEffect(() => {
        if (!chartRef.current || !areaSeriesRef.current || !twapSeriesRef.current) return;

        // Update colors based on tab
        areaSeriesRef.current.applyOptions({
            lineColor: activeTab === 'yes' ? '#10b981' : '#ef4444',
            topColor: activeTab === 'yes' ? '#10b98120' : '#ef444420',
            bottomColor: activeTab === 'yes' ? '#10b98105' : '#ef444405',
        });

        // Use absolute seconds for data points but sort/filter to ensure strictly increasing
        const data = currentToken.history
            .map(h => ({
                time: Math.floor(h.timestamp / 1000) as UTCTimestamp,
                value: h.price,
            }))
            .sort((a, b) => (a.time as number) - (b.time as number))
            .filter((item, index, self) => index === 0 || item.time > self[index - 1].time);

        const twapData = (currentToken.twapHistory || [])
            .map(h => ({
                time: Math.floor(h.timestamp / 1000) as UTCTimestamp,
                value: h.twap,
            }))
            .sort((a, b) => (a.time as number) - (b.time as number))
            .filter((item, index, self) => index === 0 || item.time > self[index - 1].time);

        areaSeriesRef.current.setData(data);
        twapSeriesRef.current.setData(twapData);

        chartRef.current.timeScale().fitContent();
    }, [strategy, activeTab]);

    // Fetch Token Addresses and Balances
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const [vAddr, yAddr] = await Promise.all([
                    getVUSDCTokenAddress(),
                    getYesTokenAddress(strategy.id)
                ]);
                setVusdcAddress(vAddr);
                setYesTokenAddressState(yAddr);
            } catch (error) {
                console.error("Failed to fetch token addresses:", error);
            }
        };
        fetchAddresses();
    }, [strategy.id]);

    const updateBalances = async () => {
        if (!user?.wallet?.address) return;
        try {
            const [vBal, yBal] = await Promise.all([
                getVUSDCBalance(user.wallet.address),
                getYESBalance(strategy.id, user.wallet.address)
            ]);
            setVusdcBalance(vBal);
            setYesBalance(yBal);
        } catch (error) {
            console.error("Failed to fetch balances:", error);
        }
    };

    useEffect(() => {
        updateBalances();
        const interval = setInterval(updateBalances, 5000);
        return () => clearInterval(interval);
    }, [user?.wallet?.address, strategy.id]);

    // Real-time Quoting
    useEffect(() => {
        if (!swapAmount || isNaN(Number(swapAmount)) || Number(swapAmount) <= 0) {
            setQuoteAmount("0.00");
            return;
        }

        if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);

        quoteTimeoutRef.current = setTimeout(async () => {
            setIsQuoting(true);
            try {
                const tokenIn = isReversed ? yesTokenAddress : vusdcAddress;
                if (!tokenIn) return;
                const quote = await getSwapQuote(strategy.id, tokenIn, swapAmount);
                setQuoteAmount(quote);
            } finally {
                setIsQuoting(false);
            }
        }, 500);

        return () => {
            if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);
        };
    }, [swapAmount, isReversed, vusdcAddress, yesTokenAddress, strategy.id]);

    const validateSwap = () => {
        if (!swapAmount || isNaN(Number(swapAmount)) || Number(swapAmount) <= 0) return null;
        const amount = Number(swapAmount);
        const balance = isReversed ? Number(yesBalance) : Number(vusdcBalance);
        if (amount > balance) return `Insufficient ${isReversed ? 'YES' : 'vUSD'} balance`;
        return null;
    };

    const handleSwap = async () => {
        const vError = validateSwap();
        if (vError) {
            setError(vError);
            return;
        }
        setError(null);
        if (!wallets[0] || !authenticated) return;
        setIsExecuting(true);
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

            const tokenIn = isReversed ? yesTokenAddress : vusdcAddress;

            if (!tokenIn) {
                setError("Token addresses not loaded. Please try again.");
                setIsExecuting(false);
                return;
            }

            if (!quoteAmount || Number(quoteAmount) <= 0) {
                setError("Price impact too high or liquidity insufficient.");
                setIsExecuting(false);
                return;
            }

            console.log(`Executing Swap: ${isReversed ? 'YES->vUSD' : 'vUSD->YES'}`, {
                proposalId: strategy.id,
                tokenIn,
                amountIn: swapAmount,
                expectedOut: quoteAmount
            });

            const amountInWei = parseUnits(swapAmount, 18);

            // Check and handle allowance
            const currentAllowance = await getAllowance(tokenIn, wallets[0].address, ROUTER_ADDRESS);

            if (currentAllowance < amountInWei) {
                setError("Approving token for trade...");
                const approveHash = await approveToken(walletClient, tokenIn, ROUTER_ADDRESS);
                await publicClient.waitForTransactionReceipt({ hash: approveHash });
            }

            setError("Executing transaction...");

            // Min Out calculation: 0.5% slippage
            const minOut = (Number(quoteAmount) * 0.995).toString();

            await executeSwap(walletClient, strategy.id, tokenIn, swapAmount, minOut);

            // Push trade to UI
            if (onTradeSuccess) {
                onTradeSuccess({
                    type: isReversed ? 'sell' : 'buy',
                    strategyId: strategy.id,
                    tokenType: 'yes',
                    price: yesPrice,
                    quantity: isReversed ? Number(swapAmount) : Number(quoteAmount),
                    timestamp: Date.now(),
                    reasoning: `Manual execution via Protocol Interface.`
                });
            }

            setSwapAmount("");
            setError(null);
            await updateBalances();
        } catch (err: any) {
            console.error("Swap failed:", err);
            setError(err.message || "Execution failed. Check your wallet.");
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-8"
        >
            {/* Navigation & Header */}
            <div className="flex flex-col gap-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Markets</span>
                </button>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {TRUSTED_DATA_SOURCES.find(t => t.id === strategy.usedDataSources?.[0]?.id)?.icon ? (
                                <img
                                    src={TRUSTED_DATA_SOURCES.find(t => t.id === strategy.usedDataSources?.[0]?.id)?.icon}
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                                    alt="Asset"
                                />
                            ) : <ArrowUpRight className="w-8 h-8 sm:w-10 sm:h-10 text-white/20" />}
                        </div>
                        <div className="flex flex-col items-center sm:items-start min-w-0 w-full">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight mb-3 break-words w-full">
                                {strategy.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                                <span className="bg-white/5 border border-white/10 px-2 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-bold text-white/60 uppercase tracking-widest italic">
                                    {strategy.evaluationLogic}
                                </span>
                                <div className="px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] uppercase font-black tracking-widest italic whitespace-nowrap">
                                    TWAP: {(strategy.yesToken.twap * 100).toFixed(1)}%
                                </div>
                                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest leading-none">
                                    <ArrowRight className="w-3 h-3 rotate-45" />
                                    {new Date(strategy.resolutionDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <p className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-1">YES Price</p>
                            <p className="text-lg sm:text-2xl font-black text-white">${yesPrice.toFixed(2)}</p>
                        </div>
                        <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                            <p className="text-[9px] sm:text-[10px] text-red-400 font-bold uppercase tracking-[0.2em] mb-1">NO Price</p>
                            <p className="text-lg sm:text-2xl font-black text-white">${noPrice.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Chart & Strategy */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Chart Card */}
                    <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-white/60 shrink-0" />
                                <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">Price Trajectory</h2>
                            </div>
                            <div className="flex bg-white/5 p-1 rounded-xl w-full sm:w-auto">
                                <button
                                    onClick={() => setActiveTab('yes')}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'yes' ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    YES Token
                                </button>
                                <button
                                    onClick={() => setActiveTab('no')}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'no' ? 'bg-red-500 text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    NO Token
                                </button>
                            </div>
                        </div>

                        <div ref={chartContainerRef} className="w-full h-[300px] sm:h-[400px]" />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-8 border-t border-white/5 pt-8">
                            <div>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">24h Volume</p>
                                <p className="text-base font-bold text-white">${(currentToken.volume || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">TWAP (60m)</p>
                                <p className="text-base font-bold text-emerald-400">${currentToken.twap.toFixed(3)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Pool Liquidity</p>
                                <p className="text-base font-bold text-white">{(currentToken.tokenReserve || 0).toFixed(0)} Tokens</p>
                            </div>
                        </div>
                    </div>

                    {/* Market Definition */}
                    <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="w-5 h-5 text-white/60" />
                                <h3 className="text-lg font-bold text-white">Market Definition</h3>
                            </div>
                            <p className="text-white/80 leading-relaxed italic text-sm border-l-4 border-white/10 pl-6 bg-white/[0.02] py-4 rounded-r-2xl">
                                "{strategy.description}"
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <Database className="w-5 h-5 text-white/60" />
                                    <h3 className="text-lg font-bold text-white">Oracle Data Sources</h3>
                                </div>
                                <div className="space-y-4">
                                    {(strategy.usedDataSources || []).map((ds, i) => {
                                        const info = TRUSTED_DATA_SOURCES.find(t => t.id === ds.id);
                                        return (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 p-1.5 overflow-hidden">
                                                        <img src={info?.icon} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{info?.name}</p>
                                                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{info?.ticker}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-mono font-bold text-white">{ds.currentValue.toFixed(2)}</p>
                                                    <p className="text-[9px] text-white/20 font-bold uppercase">Live Value</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <Shield className="w-5 h-5 text-white/60" />
                                    <h3 className="text-lg font-bold text-white">Resolution Contract</h3>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 text-xs text-center sm:text-left">
                                        <span className="text-white/40 font-bold uppercase tracking-widest whitespace-nowrap">Logic Type</span>
                                        <span className="text-white font-mono bg-white/5 px-2 py-1 rounded w-fit mx-auto sm:mx-0">CONSTANT_PRODUCT</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 text-xs text-center sm:text-left">
                                        <span className="text-white/40 font-bold uppercase tracking-widest whitespace-nowrap">Oracle Multi</span>
                                        <span className="text-white font-mono bg-white/5 px-2 py-1 rounded w-fit mx-auto sm:mx-0">VERIFIED_ONLY</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 text-xs text-center sm:text-left">
                                        <span className="text-white/40 font-bold uppercase tracking-widest whitespace-nowrap">Execution</span>
                                        <span className="text-emerald-400 font-black tracking-widest uppercase italic">Autonomous</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Swap UI */}
                <div className="space-y-6">
                    <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                        <div className="flex items-center gap-3 mb-8">
                            <Scale className="w-5 h-5 text-white/60" />
                            <h2 className="text-xl font-bold text-white">Execution Swap</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                            {isReversed ? "You Sell" : "You Pay"}
                                        </span>
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                            {isReversed ? `Balance: ${Number(yesBalance).toLocaleString()} YES` : `Balance: ${Number(vusdcBalance).toLocaleString()} vUSD`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={swapAmount}
                                            onChange={(e) => setSwapAmount(e.target.value)}
                                            className="bg-transparent border-none text-xl sm:text-2xl font-bold text-white focus:outline-none flex-1 w-full min-w-0"
                                        />
                                        <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0">
                                            {isReversed ? (
                                                <div className="w-5 h-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-400">Y</div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-400">V</div>
                                            )}
                                            <span className="text-sm font-bold text-white">{isReversed ? "YES" : "vUSD"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center -my-3 relative z-10">
                                    <button
                                        onClick={() => setIsReversed(!isReversed)}
                                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg group/arrow shrink-0"
                                    >
                                        <ArrowUpDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
                                            {isReversed ? "You Receive" : "You Buy"}
                                        </span>
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap ml-2">
                                            Price: ${yesPrice.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="text-xl sm:text-2xl font-bold text-white/90 flex-1 truncate min-w-0 flex items-center gap-2">
                                            {isQuoting ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                            ) : (
                                                quoteAmount || "0.00"
                                            )}
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-bold uppercase text-[10px] shrink-0 ${isReversed ? 'bg-white/10 border-white/20 text-white/60' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                            {isReversed ? 'vUSD' : 'YES Token'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 px-2">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-white/20">Slippage Tolerance</span>
                                    <span className="text-white/60">0.5%</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-white/20">Execution Fee</span>
                                    <span className="text-emerald-500">Free</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (!authenticated) {
                                        login();
                                        return;
                                    }
                                    handleSwap();
                                }}
                                disabled={authenticated && (isExecuting || !swapAmount || Number(swapAmount) <= 0 || isQuoting || !isMarketActive)}
                                className={`w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0 disabled:active:scale-100 ${!authenticated
                                    ? "bg-white text-black hover:bg-white/90"
                                    : "bg-emerald-500 text-white hover:bg-emerald-400"
                                    }`}
                            >
                                {!authenticated ? (
                                    <>
                                        <Wallet className="w-4 h-4" />
                                        Connect Wallet
                                    </>
                                ) : isExecuting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing Swap...
                                    </>
                                ) : !isMarketActive ? (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        Market Inactive
                                    </>
                                ) : isReversed ? "Close Position" : "Execute Order"}
                            </button>

                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                        <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Global Sentiment</h4>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500/40" style={{ width: '65%' }} />
                            <div className="h-full bg-red-500/40" style={{ width: '35%' }} />
                        </div>
                        <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-emerald-400/60">65% BULLISH</span>
                            <span className="text-red-400/60">35% BEARISH</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
