"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, AreaSeries } from 'lightweight-charts';

interface ChartProps {
    data: any[];
    interval: string;
}

export default function Chart({ data, interval }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight
                });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#c9d1d9',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderVisible: false,
            },
            rightPriceScale: {
                borderVisible: false,
                autoScale: true,
            },
            crosshair: {
                vertLine: {
                    color: 'rgba(224, 227, 235, 0.4)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#161b22',
                },
                horzLine: {
                    color: 'rgba(224, 227, 235, 0.4)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#161b22',
                },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });

        chartRef.current = chart;

        const series = chart.addSeries(AreaSeries, {
            lineColor: '#58a6ff',
            topColor: 'rgba(88, 166, 255, 0.4)',
            bottomColor: 'rgba(88, 166, 255, 0.0)',
            lineWidth: 2,
        });
        seriesRef.current = series;

        if (data && data.length > 0) {
            series.setData(data);
            chart.timeScale().fitContent();
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Update data when it changes without destroying the chart
    useEffect(() => {
        if (seriesRef.current && data && data.length > 0) {
            seriesRef.current.setData(data);
            if (chartRef.current) {
                chartRef.current.timeScale().fitContent();
            }
        }
    }, [data]);

    return (
        <div className="w-full h-full p-2 relative rounded-xl glass-panel">
            <div
                ref={chartContainerRef}
                className="absolute inset-0 m-4 rounded-lg overflow-hidden"
            />
        </div>
    );
}
