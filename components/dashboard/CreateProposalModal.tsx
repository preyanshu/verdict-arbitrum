"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, Brain, Calculator, Database, ChevronRight, Check, Info } from 'lucide-react';
import { TRUSTED_DATA_SOURCES, DataSource } from '@/lib/data-sources';

interface CreateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeAgentsCount: number;
    currentProposalsCount: number;
}

export const CreateProposalModal = ({ isOpen, onClose, activeAgentsCount, currentProposalsCount }: CreateProposalModalProps) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [equation, setEquation] = useState('');
    const [selectedSources, setSelectedSources] = useState<DataSource[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [duration, setDuration] = useState('24h');
    const [customDays, setCustomDays] = useState('1');

    const durationOptions = [
        { label: '24 Hours', value: '24h' },
        { label: '3 Days', value: '3d' },
        { label: '7 Days', value: '7d' },
        { label: 'Custom', value: 'custom' }
    ];

    const getResolutionTime = () => {
        const now = new Date();
        if (duration === 'custom') {
            const days = Math.min(Math.max(parseInt(customDays) || 1, 1), 30);
            now.setDate(now.getDate() + days);
        } else {
            const value = parseInt(duration);
            const unit = duration.slice(-1);
            if (unit === 'h') now.setHours(now.getHours() + value);
            if (unit === 'd') now.setDate(now.getDate() + value);
        }
        return now.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredSources = TRUSTED_DATA_SOURCES.filter(source =>
        source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSource = (source: DataSource) => {
        if (selectedSources.find(s => s.id === source.id)) {
            setSelectedSources(selectedSources.filter(s => s.id !== source.id));
        } else {
            setSelectedSources([...selectedSources, source]);
        }
    };

    const reset = () => {
        setStep(1);
        setName('');
        setEquation('');
        setSelectedSources([]);
        setSearchQuery('');
        setDuration('24h');
        setCustomDays('1');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <Plus className="w-5 h-5 text-emerald-500" />
                                    Launch New Market
                                </h2>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Design your strategic proposal</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {step === 1 ? (
                                <div className="space-y-8">
                                    {/* Name Input */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1 italic">Proposal Identity</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Tech Dominance & Oil Hedge"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-emerald-500/30 transition-all"
                                        />
                                    </div>

                                    {/* Data Source Selection */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Intelligence Layer</label>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{selectedSources.length} Selected</span>
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search data feeds (SPY, BTC, Crude...)"
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold placeholder:text-white/10 focus:outline-none focus:border-emerald-500/30 transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredSources.map((source) => {
                                                const isSelected = selectedSources.find(s => s.id === source.id);
                                                return (
                                                    <button
                                                        key={source.id}
                                                        onClick={() => toggleSource(source)}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/10'}`}
                                                    >
                                                        <img src={source.icon} alt={source.name} className="w-5 h-5 object-contain" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase tracking-tight">{source.ticker}</span>
                                                            <span className="text-[9px] opacity-40 font-bold truncate">{source.name}</span>
                                                        </div>
                                                        {isSelected && <Check className="w-3 h-3 ml-auto" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Equation Builder */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Mathematical Logic</label>
                                            <button className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest hover:text-emerald-500 transition-colors">Syntax Help</button>
                                        </div>
                                        <div className="relative group">
                                            <Calculator className="absolute left-4 top-4 w-5 h-5 text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                                            <textarea
                                                rows={3}
                                                value={equation}
                                                onChange={(e) => setEquation(e.target.value)}
                                                placeholder="e.g., (asset_SPY_price > 520) AND (asset_BTC_price < 65000)"
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 pl-12 text-white font-mono text-sm placeholder:text-white/10 focus:outline-none focus:border-emerald-500/30 transition-all resize-none"
                                            />
                                        </div>
                                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest px-1">Format: (asset_TICKER_price [operator] [value])</p>
                                    </div>

                                    {/* Market Duration */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Market Duration</label>
                                            {duration === 'custom' && (
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{customDays} DAYS</span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {durationOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setDuration(opt.value)}
                                                    className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${duration === opt.value ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-white/20 hover:border-white/10'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        {duration === 'custom' && (
                                            <div className="pt-2 px-1">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="30"
                                                    step="1"
                                                    value={customDays}
                                                    onChange={(e) => setCustomDays(e.target.value)}
                                                    className="w-full accent-emerald-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <div className="flex justify-between mt-2">
                                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">1 Day</span>
                                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">30 Days</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Review Summary */}
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Brain className="w-24 h-24 text-emerald-500" />
                                        </div>

                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1 italic">Strategic Proposal</p>
                                                    <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{name || 'Untitled Proposal'}</h3>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Logic Structure</p>
                                                    <p className="text-sm font-mono text-white/80 line-clamp-2">{equation || 'No logic defined'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Intelligence Sources</p>
                                                    <div className="flex gap-2">
                                                        {selectedSources.slice(0, 3).map(s => (
                                                            <img key={s.id} src={s.icon} title={s.ticker} className="w-5 h-5" alt={s.ticker} />
                                                        ))}
                                                        {selectedSources.length > 3 && (
                                                            <span className="text-[10px] font-black text-white/40">+{selectedSources.length - 3}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Resolution Window</p>
                                                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                                                        {duration === 'custom' ? `${customDays} DAYS` : duration.toUpperCase()} • {getResolutionTime()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Market Context Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Active Agents</p>
                                            <p className="text-xl font-black text-white tracking-tight">{activeAgentsCount}</p>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Proposals</p>
                                            <p className="text-xl font-black text-white tracking-tight">{currentProposalsCount}</p>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Round Time</p>
                                            <p className="text-xl font-black text-emerald-500 tracking-tight">25 MIN</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                                        <div className="mt-1">
                                            <Info className="w-4 h-4 text-white/20" />
                                        </div>
                                        <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-widest">
                                            By confirming, your proposal will be entered into the evaluation round. Agents will begin assessing strategic viability immediately after launch.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <button
                                onClick={() => step === 1 ? handleClose() : setStep(1)}
                                className="px-6 py-3 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
                            >
                                {step === 1 ? 'Cancel Execution' : 'Modify Logic'}
                            </button>

                            <button
                                onClick={() => step === 1 ? setStep(2) : handleClose()}
                                disabled={step === 1 && (!name || !equation || selectedSources.length === 0)}
                                className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all relative overflow-hidden ${step === 2 ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white text-black hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-white'}`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {step === 1 ? (
                                        <>
                                            Review Summary
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Confirm Launch
                                            <Database className="w-4 h-4" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
