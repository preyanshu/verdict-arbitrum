"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, ChevronRight, Wallet, LogOut, Copy, Check } from "lucide-react";
import { Logo } from "./Logo";
import { usePrivy } from '@privy-io/react-auth';

interface NavbarProps {
    transparent?: boolean;
}

export const Navbar = ({ transparent = true }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const pathname = usePathname();
    const isLandingPage = pathname === '/';
    const { login, logout, authenticated, user } = usePrivy();

    const landingLinks = [
        { name: 'Vision', href: '#hero' },
        { name: 'Features', href: '#features' },
        { name: 'Performance', href: '#stats' },
        { name: 'Docs', href: '#' }
    ];

    const dashboardLinks = [
        { name: 'Home', href: '/dashboard' },
        { name: 'Agents', href: '/dashboard/agents' },
        { name: 'Sources', href: '/dashboard/sources' },
        { name: 'History', href: '/dashboard/history' },
        { name: 'Docs', href: '#' }
    ];

    const currentLinks = isLandingPage ? landingLinks : dashboardLinks;

    useEffect(() => {
        if (user) {
            console.log("Full Privy User Object:", user);
        }
    }, [user]);

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{
                    y: 0,
                    opacity: 1,
                    backgroundColor: isOpen ? "rgba(8, 8, 12, 0.98)" : (transparent ? "rgba(0, 0, 0, 0)" : "rgba(8, 8, 12, 0.85)"),
                    backdropFilter: isOpen ? "blur(40px)" : (transparent ? "blur(0px)" : "blur(40px)"),
                }}
                transition={{
                    y: { duration: 0.5, ease: "easeOut" },
                    opacity: { duration: 0.5 },
                    backgroundColor: { duration: 0.3 },
                    backdropFilter: { duration: 0.3 }
                }}
                className={`fixed top-0 left-0 right-0 flex items-center justify-between px-4 lg:px-8 py-4 lg:py-5 mx-auto w-full z-[100] ${!isOpen ? `${transparent ? 'lg:bg-transparent lg:backdrop-blur-none lg:border-none' : ''} border-b border-white/5 bg-black/80 backdrop-blur-2xl` : 'border-b border-white/10'}`}
            >
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between relative z-[110]">
                    <Link href="/">
                        <Logo />
                    </Link>

                    <div className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-md px-1 py-1 rounded-full border border-white/10" onMouseLeave={() => setHoveredIndex(null)}>
                        {currentLinks.map((item, i) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    className={`relative px-4 xl:px-6 py-2 rounded-full text-sm font-medium transition-all group ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <span className="relative z-10">{item.name}</span>
                                    {isActive && !hoveredIndex !== null && (
                                        <motion.span
                                            layoutId="nav-glow-active"
                                            className="absolute inset-0 bg-emerald-500/10 rounded-full z-0 border border-emerald-500/20"
                                        />
                                    )}
                                    {(hoveredIndex === i || isActive) && (
                                        <>
                                            <motion.span
                                                layoutId="nav-underline"
                                                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] z-20"
                                            />
                                            {hoveredIndex === i && (
                                                <motion.span
                                                    layoutId="nav-glow"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    className="absolute inset-0 bg-white/5 rounded-full z-0"
                                                />
                                            )}
                                        </>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop Action Button */}
                    <div className="hidden lg:flex items-center gap-3 relative">
                        {isLandingPage ? (
                            <Link href="/dashboard">
                                <button
                                    className="group relative flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-400 hover:text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                >
                                    Launch App
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </Link>
                        ) : authenticated ? (
                            <div
                                className="relative"
                                onMouseEnter={() => setIsAccountOpen(true)}
                                onMouseLeave={() => setIsAccountOpen(false)}
                            >
                                <button
                                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                                    className={`flex items-center gap-3 bg-white/5 border rounded-2xl px-4 py-2 transition-all hover:bg-white/10 ${isAccountOpen ? 'border-emerald-500/30 bg-white/10' : 'border-white/10'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 overflow-hidden border border-emerald-500/20 relative">
                                        {user?.google?.email ? (
                                            (user.google as any).picture ? (
                                                <img
                                                    src={(user.google as any).picture}
                                                    alt={user.google.name || 'User'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase">
                                                    {user.google.email.charAt(0)}
                                                </div>
                                            )
                                        ) : (
                                            <Wallet className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs font-bold text-white tracking-tight">
                                            {user?.google?.name || (user?.wallet?.address ? truncateAddress(user.wallet.address) : 'Connected')}
                                        </span>
                                        <span className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest leading-none">
                                            View Identity
                                        </span>
                                    </div>
                                    <ChevronRight className={`w-3 h-3 text-white/20 transition-transform duration-300 ${isAccountOpen ? 'rotate-90' : 'rotate-0'}`} />
                                </button>

                                {/* Wallet Explorer Dropdown */}
                                <div className={`absolute top-full right-0 w-72 pt-3 transition-all duration-300 z-[120] ${isAccountOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                                    {/* Invisible Bridge to keep hover active */}
                                    <div className="absolute top-0 left-0 w-full h-3" />

                                    <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-3xl">
                                        <div className="space-y-6">
                                            {/* Balance Section */}
                                            <div>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Total Liquidity</p>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-2xl font-black text-white font-mono tracking-tighter">$1,024.50</span>
                                                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-1">vUSD</span>
                                                </div>
                                            </div>

                                            {/* Identity Section */}
                                            <div className="pt-6 border-t border-white/5">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Connected Identity</p>
                                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Network</span>
                                                        <span className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[10px] text-white font-bold uppercase tracking-tight">Quantum EVM</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Address</span>
                                                        <button
                                                            onClick={() => {
                                                                if (user?.wallet?.address) {
                                                                    navigator.clipboard.writeText(user.wallet.address);
                                                                }
                                                            }}
                                                            className="flex items-center gap-2 hover:text-white transition-colors group/copy"
                                                        >
                                                            <span className="text-[10px] text-white/60 font-mono">
                                                                {user?.wallet?.address ? truncateAddress(user.wallet.address) : 'N/A'}
                                                            </span>
                                                            <Copy className="w-3 h-3 text-white/20 group-hover/copy:text-emerald-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Section */}
                                            <button
                                                onClick={() => logout()}
                                                className="w-full py-3 rounded-xl bg-red-400/5 border border-red-400/10 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-400/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                Terminate Session
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => login()}
                                className="group relative flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-emerald-500 text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                            >
                                <Wallet className="w-4 h-4" />
                                Connect Wallet
                                <motion.div
                                    className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </button>
                        )}
                    </div>

                    {/* Mobile Identity/Action */}
                    <div className="flex lg:hidden items-center gap-2">
                        {isLandingPage ? (
                            <Link href="/dashboard">
                                <button
                                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform active:scale-90"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </Link>
                        ) : authenticated ? (
                            <button
                                onClick={() => setIsAccountOpen(true)}
                                className={`w-10 h-10 rounded-full border flex items-center justify-center overflow-hidden transition-all ${isAccountOpen ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-emerald-500/10 border-emerald-500/20'}`}
                            >
                                {user?.google?.email ? (
                                    (user.google as any).picture ? (
                                        <img
                                            src={(user.google as any).picture}
                                            alt="User"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-black uppercase text-emerald-400">
                                            {user.google.email.charAt(0)}
                                        </div>
                                    )
                                ) : (
                                    <Wallet className="w-5 h-5 text-emerald-400" />
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => login()}
                                className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform active:scale-90"
                            >
                                <Wallet className="w-5 h-5" />
                            </button>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className="text-white p-2 transition-transform active:scale-90"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <ChevronRight className="w-6 h-6 rotate-90" />}
                        </button>
                    </div>
                </div>

            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-[72px] lg:top-[84px] left-0 right-0 bg-[#08080c]/98 backdrop-blur-3xl border-b border-white/10 p-6 flex flex-col gap-4 lg:hidden z-[150]"
                    >
                        {currentLinks.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center justify-between text-lg font-medium px-4 py-3 rounded-xl transition-all ${isActive ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                        <div className="w-full mt-4 space-y-4">
                            {isLandingPage ? (
                                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                    <button
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                    >
                                        Launch App
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </Link>
                            ) : !authenticated && (
                                <button
                                    onClick={() => { login(); setIsOpen(false); }}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-500 text-black font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                                >
                                    <Wallet className="w-5 h-5" />
                                    Connect Wallet
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Account Modal Overlay */}
            <AnimatePresence>
                {isAccountOpen && (
                    <div className="lg:hidden fixed inset-0 z-[200] flex items-center justify-center px-4 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAccountOpen(false)}
                            className="fixed inset-0 bg-black/90 backdrop-blur-2xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm relative z-[210] shadow-2xl shadow-emerald-500/5"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsAccountOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="space-y-8">
                                {/* Total Liquidity - Top Section */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]">Total Liquidity</p>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-4xl font-black text-white font-mono tracking-tighter leading-none">$1,024.50</span>
                                        <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">vUSD</span>
                                    </div>
                                    <div className="h-px bg-white/5 w-full mt-4" />
                                </div>

                                {/* Connected Identity Info */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]">Connected Identity</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 overflow-hidden">
                                                {user?.google?.email && (user.google as any).picture ? (
                                                    <img src={(user.google as any).picture} className="w-full h-full object-cover" alt="" />
                                                ) : <Wallet className="w-3 h-3 text-emerald-500" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Name & Email Block */}
                                    {(user?.google?.name || user?.google?.email) && (
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                                            {user?.google?.name && (
                                                <p className="text-sm font-bold text-white tracking-tight">{user.google.name}</p>
                                            )}
                                            {user?.google?.email && (
                                                <p className="text-[10px] text-white/40 font-medium tracking-tight truncate">{user.google.email}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Network & Address Container */}
                                    <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Network</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[10px] text-white font-black uppercase tracking-tight">Quantum EVM</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Address</span>
                                            <button
                                                onClick={() => user?.wallet?.address && navigator.clipboard.writeText(user.wallet.address)}
                                                className="flex items-center gap-2 group/copy"
                                            >
                                                <span className="text-[10px] text-white/50 font-mono tracking-tighter">
                                                    {user?.wallet?.address ? truncateAddress(user.wallet.address) : 'N/A'}
                                                </span>
                                                <Copy className="w-3 h-3 text-white/20 group-hover/copy:text-emerald-500 transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Terminate Session */}
                                <button
                                    onClick={() => logout()}
                                    className="w-full py-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-[0.25em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                                >
                                    <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                    Terminate Session
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
