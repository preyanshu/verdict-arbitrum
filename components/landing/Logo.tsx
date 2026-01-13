import { Link as LinkIcon } from "lucide-react";

export const Logo = () => (
    <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-white select-none cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            <LinkIcon className="w-4 h-4" />
        </div>
        <span>VERDICT</span>
    </div>
);
