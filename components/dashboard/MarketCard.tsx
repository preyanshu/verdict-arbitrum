"use client";

import { useState } from "react";
import { MarketStrategy } from "@/lib/types";
import { Activity, ArrowUpRight, ChevronDown, ChevronUp, Database } from "lucide-react";
import { TRUSTED_DATA_SOURCES } from "@/lib/data-sources";
import { AnimatePresence, motion } from "framer-motion";

interface MarketCardProps {
    strategy: MarketStrategy;
    onClick?: (id: string) => void;
}

export function MarketCard({ strategy, onClick }: MarketCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getLatestPrice = (token: { history: Array<{ price: number }> }) => {
        return token.history[token.history.length - 1]?.price ?? 0.5;
    };

    const yesPrice = getLatestPrice(strategy.yesToken);
    const noPrice = getLatestPrice(strategy.noToken);

    // Get primary asset icon
    const primaryDataSource = TRUSTED_DATA_SOURCES.find(t => t.id === strategy.usedDataSources?.[0]?.id);

    return (
        <div
            onClick={() => onClick?.(strategy.id)}
            className="group relative bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-4 sm:p-6 rounded-2xl hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.02)] cursor-pointer"
        >
            {/* Header Info */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center overflow-hidden transition-colors group-hover:border-white/10 shrink-0">
                        {primaryDataSource?.icon ? (
                            <img
                                src={primaryDataSource.icon}
                                alt={primaryDataSource.name}
                                className="w-7 h-7 sm:w-10 sm:h-10 object-contain transition-all duration-500"
                            />
                        ) : (
                            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white/40" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                            {strategy.name}
                        </h3>
                        <p className="text-[9px] sm:text-[11px] text-white/80 uppercase tracking-widest font-black italic mt-1 bg-white/5 px-1.5 sm:px-2 py-0.5 rounded w-fit leading-none">
                            {strategy.evaluationLogic}
                        </p>
                    </div>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-black tracking-widest italic whitespace-nowrap shrink-0">
                    TWAP: {(strategy.yesToken.twap * 100).toFixed(1)}%
                </div>
            </div>

            {/* Proposal Rows */}
            <div className="space-y-3">
                {/* YES Row */}
                <div className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group/row">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] sm:text-xs font-black text-emerald-400 shrink-0">Y</div>
                        <span className="text-sm sm:text-base font-bold text-white group-hover/row:text-white transition-colors tracking-tight">Support Proposal</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 sm:h-10 px-4 sm:px-6 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center justify-center">
                            YES ${yesPrice.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* NO Row */}
                <div className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group/row">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[10px] sm:text-xs font-black text-red-400 shrink-0">N</div>
                        <span className="text-sm sm:text-base font-bold text-white/50 group-hover/row:text-white/80 transition-colors tracking-tight">Reject Proposal</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 sm:h-10 px-4 sm:px-6 rounded-lg bg-red-500/20 text-red-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-red-500/30 flex items-center justify-center">
                            NO ${noPrice.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Accordion Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="mt-6 w-full py-3 flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 hover:text-white/70 transition-all border-t border-white/10"
            >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {isExpanded ? 'Hide Strategy Details' : 'View Strategy Details'}
            </button>

            {/* Advanced Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="mt-6 space-y-8 pt-2">
                            <div className="pl-1">
                                <p className="text-sm leading-relaxed text-white/80 font-medium italic border-l-2 border-white/20 pl-5 bg-white/[0.02] py-4 rounded-r-xl">
                                    "{strategy.description}"
                                </p>
                            </div>

                            <div className="flex flex-col gap-6 border-t border-white/10 pt-8">
                                <div className="flex flex-wrap gap-6">
                                    {strategy.usedDataSources?.map((ds, i) => {
                                        const detailedInfo = TRUSTED_DATA_SOURCES.find(t => t.id === ds.id);
                                        return (
                                            <div key={i} className="flex items-center gap-4 group/ds">
                                                <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center p-2 overflow-hidden transition-colors group-hover/ds:border-white/20 shrink-0">
                                                    {detailedInfo?.icon ? (
                                                        <img src={detailedInfo.icon} alt={detailedInfo.name} className="w-full h-full object-contain filter grayscale group-hover/ds:grayscale-0 transition-all" />
                                                    ) : (
                                                        <Database className="w-5 h-5 text-white/40" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-white/80 uppercase font-bold tracking-widest leading-none">
                                                        {detailedInfo?.ticker || `ID ${ds.id}`}
                                                    </span>
                                                    <span className="text-sm text-white font-mono font-bold tracking-tighter mt-1">
                                                        {ds.currentValue.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-[11px] text-white/60 font-mono uppercase tracking-[0.3em] font-bold text-center w-full py-2 bg-white/5 rounded border border-white/5">
                                    Verified Oracle Resolution
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
