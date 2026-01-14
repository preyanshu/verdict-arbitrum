"use client";

import { MarketState } from "@/lib/types";
import { Clock, RefreshCw, BarChart3, Users } from "lucide-react";

interface MarketStatusProps {
    state: MarketState;
    agentCount: number;
    now: number;
    forceExecuting?: boolean;
}

export function MarketStatus({ state, agentCount, now, forceExecuting }: MarketStatusProps) {
    const timeLeft = Math.max(0, state.roundEndTime - now);
    const m = Math.floor(timeLeft / (1000 * 60));
    const s = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const stats = [
        {
            label: state.isExecutingTrades ? "Round Time" : "Round Duration",
            value: state.isExecutingTrades
                ? (m > 0 ? `${m}m ${s}s` : `${s}s`)
                : (() => {
                    const dm = Math.floor(state.roundDuration / (1000 * 60));
                    const ds = Math.floor((state.roundDuration % (1000 * 60)) / 1000);
                    return dm > 0 ? `${dm}m ${ds}s` : `${ds}s`;
                })(),
            icon: Clock,
            active: true,
            iconColor: "text-emerald-500"
        },
        {
            label: "Active Agents",
            value: agentCount.toString(),
            icon: Users,
            active: false,
            iconColor: "text-white/20"
        },
        {
            label: "Active Markets",
            value: state.strategies.length.toString(),
            icon: BarChart3,
            active: false,
            iconColor: "text-white/20"
        },
        {
            label: "Status",
            value: (state.isExecutingTrades || forceExecuting) ? 'Executing' : 'Standing By',
            icon: RefreshCw,
            active: state.isExecutingTrades || forceExecuting || state.isMakingBatchLLMCall,
            spin: state.isExecutingTrades || forceExecuting || state.isMakingBatchLLMCall,
            iconColor: (state.isExecutingTrades || forceExecuting) ? "text-emerald-500" : "text-white/20"
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-4 sm:p-5 rounded-[20px] flex flex-col gap-4"
                >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/[0.03] flex items-center justify-center">
                        <stat.icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${stat.iconColor} ${stat.spin ? 'animate-spin' : ''}`} />
                    </div>

                    <div className="space-y-0.5 sm:space-y-1">
                        <p className="text-[8px] sm:text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">
                            {stat.label}
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {stat.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
