"use client";

import { Navbar } from "@/components/landing/Navbar";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background text-white">
            <Navbar transparent={false} />
            <div className="flex items-center justify-center min-h-screen pt-20">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-white tracking-tighter">Verdict Dashboard</h1>
                    <p className="text-gray-400">Welcome to the future of AI-driven markets.</p>
                    <div className="pt-8">
                        <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium animate-pulse">
                            Dashboard Template Ready
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
