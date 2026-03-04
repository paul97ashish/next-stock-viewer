"use client";

import { useState, useEffect } from "react";
import Chart from "@/components/Chart";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [ticker, setTicker] = useState("AAPL");
  const [range, setRange] = useState("1y");

  const [chartData, setChartData] = useState([]);
  const [info, setInfo] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data when Ticker or Range change
  useEffect(() => {
    let active = true;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        let interval = "1d";
        if (range === "1d" || range === "5d") interval = "5m";
        else if (range === "1mo" || range === "3mo") interval = "1h";

        const historyRes = await fetch(`/api/history?ticker=${ticker}&period=${range}&interval=${interval}`);

        if (!historyRes.ok) {
          const errorText = await historyRes.text();
          throw new Error(`API Error ${historyRes.status}: ${errorText}`);
        }

        const histData = await historyRes.json();

        if (active) {
          setChartData(histData);
        }

        const infoRes = await fetch(`/api/info?ticker=${ticker}`);
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          if (active) setInfo(infoData);
        }

        const newsRes = await fetch(`/api/news?ticker=${ticker}`);
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          if (active) setSentiment(newsData);
        }

      } catch (err: any) {
        console.error("Fetch Data Error: ", err);
        if (active) setError(err.message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchData();

    return () => { active = false; };
  }, [ticker, range]);

  return (
    <div className="flex w-screen h-screen bg-[#06090e] text-white p-4 gap-4 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        ticker={ticker}
        setTicker={setTicker}
        range={range}
        setRange={setRange}
        info={info}
        sentiment={sentiment}
      />

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col gap-4 relative">
        <div className="flex-1 min-h-0 relative">

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06090e]/50 backdrop-blur-sm rounded-xl border border-white/5">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#06090e]/80 backdrop-blur-md rounded-xl border border-red-500/20">
              <div className="bg-red-950/50 text-red-400 p-6 rounded-lg text-center max-w-md border border-red-500/30">
                <h3 className="text-xl font-bold mb-2">Failed to Fetch Data</h3>
                <p className="text-sm font-mono break-all">{error}</p>
              </div>
            </div>
          )}

          <Chart data={chartData} interval={range} />
        </div>
      </div>
    </div>
  );
}
