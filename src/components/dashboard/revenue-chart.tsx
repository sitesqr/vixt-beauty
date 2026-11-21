"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export function RevenueChart({
  data,
  height = 260,
  labelFormatter,
}: {
  data: { label?: string; month?: string; total: number }[];
  height?: number;
  labelFormatter?: (key: string) => string;
}) {
  const chartData = data.map((d) => ({
    name: d.label ?? d.month ?? "",
    total: d.total,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="vixtRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0557E" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#E0557E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#F7A0B8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#F7A0B8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${Number(v).toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              background: "#24161B",
              border: "1px solid #ffffff18",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v) => [formatCurrency(Number(v) * 100), "Faturamento"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#EE7998"
            strokeWidth={2.5}
            fill="url(#vixtRevGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
