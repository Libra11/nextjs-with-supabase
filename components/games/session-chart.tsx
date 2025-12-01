"use client";

import { PlaySession } from "@/types/games";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";

interface SessionChartProps {
  sessions: PlaySession[];
}

export function SessionChart({ sessions }: SessionChartProps) {
  // Group sessions by day or month. For now, let's do daily breakdown for the current month/view
  // Or just aggregate by date for the chart.

  const data = sessions
    .reduce(
      (acc, session) => {
        const date = format(parseISO(session.start_time), "yyyy-MM-dd");
        const hours = session.duration_seconds / 3600;

        const existing = acc.find((d) => d.date === date);
        if (existing) {
          existing.hours += hours;
        } else {
          acc.push({ date, hours });
        }
        return acc;
      },
      [] as { date: string; hours: number }[]
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  // If empty, show empty state?
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No session history available
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#666"
            tickFormatter={(str) => format(parseISO(str), "MMM d")}
            fontSize={12}
          />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }}
            itemStyle={{ color: "#fff" }}
            labelFormatter={(label) => format(parseISO(label), "PPP")}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorHours)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
