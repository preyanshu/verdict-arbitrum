"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, ChevronRight } from "lucide-react";
import { Logo } from "./Logo";

interface NavbarProps {
    transparent?: boolean;
}

export const Navbar = ({ transparent = true }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{
                y: 0,
                opacity: 1,
                backgroundColor: isOpen ? "rgba(0, 0, 0, 0.9)" : (transparent ? "rgba(0, 0, 0, 0)" : "rgba(0, 0, 0, 0.5)"),
                backdropFilter: isOpen ? "blur(24px)" : (transparent ? "blur(0px)" : "blur(24px)"),
            }}
            transition={{
                y: { duration: 0.5, ease: "easeOut" },
                opacity: { duration: 0.5 },
                backgroundColor: { duration: 0.3 },
                backdropFilter: { duration: 0.3 }
            }}
            className={`fixed top-0 left-0 right-0 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 mx-auto w-full z-[100] ${!isOpen ? `${transparent ? 'lg:bg-transparent lg:backdrop-blur-none lg:border-none' : ''} border-b border-white/5 bg-black/50 backdrop-blur-xl` : 'border-b border-white/10'}`}
        >
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between relative z-[110]">
                <Logo />

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-md px-1.5 py-1.5 rounded-full border border-white/10" onMouseLeave={() => setHoveredIndex(null)}>
                    {[
                        { name: 'Home', href: '#' },
                        { name: 'Features', href: '#features' },
                        { name: 'Numbers', href: '#numbers' },
                        { name: 'Docs', href: '#' }
                    ].map((item, i) => (
                        <a
                            key={item.name}
                            href={item.href}
                            onMouseEnter={() => setHoveredIndex(i)}
                            className="relative px-6 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors group"
                        >
                            <span className="relative z-10">{item.name}</span>
                            {hoveredIndex === i && (
                                <>
                                    <motion.span
                                        layoutId="nav-underline"
                                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)] z-20"
                                    />
                                    <motion.span
                                        layoutId="nav-glow"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        className="absolute inset-0 bg-white/5 rounded-full z-0"
                                    />
                                </>
                            )}
                        </a>
                    ))}
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:block">
                    <Link href="/dashboard">
                        <Button variant="outline" className="rounded-full border-white/20 hover:bg-white/10 hover:text-white text-white hover:border-white/40 bg-transparent">
                            Launch App
                        </Button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <ChevronRight className="w-6 h-6 rotate-90" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 bg-black/50 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-4 md:hidden z-[100]"
                >
                    {[
                        { name: 'Home', href: '#' },
                        { name: 'Features', href: '#features' },
                        { name: 'Numbers', href: '#numbers' },
                        { name: 'Docs', href: '#' }
                    ].map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className="text-lg font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5"
                            onClick={() => setIsOpen(false)}
                        >
                            {item.name}
                        </a>
                    ))}
                    <Link href="/dashboard" className="w-full mt-4" onClick={() => setIsOpen(false)}>
                        <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-black font-bold h-12">
                            Launch App
                        </Button>
                    </Link>
                </motion.div>
            )}
        </motion.nav>
    );
};

