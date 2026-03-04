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

  // Fetch Data when Ticker or Range change
  useEffect(() => {
    let active = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        // Determine interval purely for UI
        let interval = "1d";
        if (range === "1d" || range === "5d") interval = "5m";
        else if (range === "1mo" || range === "3mo") interval = "1h";

        const historyRes = await fetch(`/api/history?ticker=${ticker}&period=${range}&interval=${interval}`);
        if (!historyRes.ok) throw new Error("Failed to load history");
        const histData = await historyRes.json();

        if (active) {
          setChartData(histData);
        }

        // Info and News are independent of date ranges, only fetch if ticker changes, 
        // but for simplicity we fetch them here or rely on Vercel Edge caching
        const infoRes = await fetch(`/api/info?ticker=${ticker}`);
        const infoData = await infoRes.json();
        if (active) setInfo(infoData);

        const newsRes = await fetch(`/api/news?ticker=${ticker}`);
        const newsData = await newsRes.json();
        if (active) setSentiment(newsData);

      } catch (err) {
        console.error(err);
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

          <Chart data={chartData} interval={range} />
        </div>
      </div>
    </div>
  );
}
