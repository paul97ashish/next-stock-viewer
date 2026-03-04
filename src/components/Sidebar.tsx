"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface SidebarProps {
    ticker: string;
    setTicker: (val: string) => void;
    range: string;
    setRange: (val: string) => void;
    info: any;
    sentiment: any;
}

const RANGES = [
    { label: "1D", val: "1d" },
    { label: "1W", val: "5d" },
    { label: "1M", val: "1mo" },
    { label: "3M", val: "3mo" },
    { label: "1Y", val: "1y" },
    { label: "5Y", val: "5y" },
];

export default function Sidebar({ ticker, setTicker, range, setRange, info, sentiment }: SidebarProps) {
    const [searchInput, setSearchInput] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setTicker(searchInput.trim().toUpperCase());
            setSearchInput("");
        }
    };

    return (
        <div className="w-80 h-full flex flex-col gap-6 p-4 glass-panel overflow-y-auto">
            {/* Search Bar */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-white">Stock Viewer</h2>
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder="Search Ticker (e.g. AAPL)"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-white focus:outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="absolute right-2 top-2.5 text-gray-400 hover:text-white">
                        <Search size={18} />
                    </button>
                </form>
            </div>

            {/* Quick Ranges */}
            <div>
                <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider font-semibold">Quick Ranges</h3>
                <div className="grid grid-cols-3 gap-2">
                    {RANGES.map((r) => (
                        <button
                            key={r.val}
                            onClick={() => setRange(r.val)}
                            className={`py-2 rounded-lg border text-sm transition-colors ${range === r.val
                                    ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                    : "bg-[#0d1117]/50 border-gray-700 text-gray-300 hover:border-gray-500"
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Info Display */}
            {info && (
                <div className="mt-2">
                    <h3 className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-semibold">Active Target</h3>
                    <div className="bg-[#0d1117]/50 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-bold text-white mb-1">{info.name || ticker}</h4>
                        <div className="text-2xl font-light text-blue-400">
                            {info.price !== "N/A" ? `${info.price} ${info.currency}` : "Loading..."}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Prediction Model */}
            <div className="mt-auto pt-4 border-t border-gray-700/50">
                <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider font-semibold">News Sentiment Model</h3>
                <div className="bg-[#0d1117]/50 border border-gray-700 rounded-lg p-4 space-y-3 relative overflow-hidden">

                    <div className="flex justify-between items-center z-10 relative">
                        <span className="text-sm text-gray-300">Composite Signal</span>
                        {sentiment ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${sentiment.overallSentiment === "Positive" ? "bg-green-500/20 text-green-400" :
                                    sentiment.overallSentiment === "Negative" ? "bg-red-500/20 text-red-400" :
                                        "bg-gray-500/20 text-gray-400"
                                }`}>
                                {sentiment.overallSentiment.toUpperCase()}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-500">Calculating...</span>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 z-10 relative">
                        Based on natural language processing of the last 10 news articles. This is not financial advice.
                    </p>
                </div>
            </div>

        </div>
    );
}
