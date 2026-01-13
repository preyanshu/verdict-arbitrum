import { Logo } from "./Logo";

export const Footer = () => (
    <footer className="py-12 px-6 border-t border-white/5 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <Logo />
                <p className="text-sm text-gray-600">
                    © {new Date().getFullYear()} Verdict. Built for the next generation of markets.
                </p>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-500">
                <a href="#" className="hover:text-white transition-colors font-medium">Twitter</a>
                <a href="#" className="hover:text-white transition-colors font-medium">Docs</a>
                <a href="#" className="hover:text-white transition-colors font-medium">Markets</a>
            </div>
        </div>
    </footer>
);
