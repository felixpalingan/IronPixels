"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/formatters";

interface StatRadarChartProps {
  stats: {
    str: number;
    agi: number;
    vit: number;
    luk: number;
  };
}

export function StatRadarChart({ stats }: StatRadarChartProps) {
  const chartData = [
    { subject: "STR", value: stats.str, fullMark: 100 },
    { subject: "AGI", value: stats.agi, fullMark: 100 },
    { subject: "VIT", value: stats.vit, fullMark: 100 },
    { subject: "LUK", value: stats.luk, fullMark: 100 },
  ];

  return (
    <div className="relative w-full h-[260px] flex items-center justify-center bg-surface-container/50 border border-pixel-border/40 p-2 my-2">
      <div className="absolute top-2 left-3 font-mono text-[10px] tracking-widest text-gray-400 uppercase">
        BASE ATTRIBUTES
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="52%" outerRadius="65%" data={chartData}>
          <PolarGrid stroke="#2a2a2a" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={({ x, y, payload }) => {
              const statKey = payload.value.toLowerCase() as keyof typeof stats;
              const rawVal = stats[statKey];
              const valFormatted = formatNumber(rawVal);
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fill="#00ff41"
                  className="font-mono text-xs font-bold"
                >
                  <tspan x={x} dy="-4">{payload.value}</tspan>
                  <tspan x={x} dy="14" fill="#ffffff" className="font-extrabold">{valFormatted}</tspan>
                </text>
              );
            }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Stats"
            dataKey="value"
            stroke="#00ff41"
            fill="#00ff41"
            fillOpacity={0.25}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
