"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Candle, IndicatorPoint } from "@/types";
import type { IndicatorKey } from "@/lib/indicatorSummary";

function valuesFor<T extends object>(data: T[], keys: Array<keyof T>) {
  const values: number[] = [];
  data.forEach((item) => {
    keys.forEach((key) => {
      const value = item[key];
      if (typeof value === "number" && Number.isFinite(value)) values.push(value);
    });
  });
  return values;
}

function paddedDomain<T extends object>(
  data: T[],
  keys: Array<keyof T>,
  options: { padding?: number; includeZero?: boolean; symmetricAroundZero?: boolean } = {}
): [number, number] {
  const values = valuesFor(data, keys);
  if (!values.length) return [0, 1];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (options.includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (options.symmetricAroundZero) {
    const extent = Math.max(Math.abs(min), Math.abs(max), 1);
    min = -extent;
    max = extent;
  }
  const span = max - min;
  const pad = span === 0 ? Math.max(Math.abs(max) * 0.02, 1) : span * (options.padding ?? 0.08);
  return [min - pad, max + pad];
}

const formatAxis = (value: number) =>
  Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2
  });

export function MiniSparkline({ positive }: { positive: boolean }) {
  const data = [4, 6, 5, 7, 4, 5, 8, 7].map((value, index) => ({ index, value: positive ? value : 10 - value }));
  return (
    <div style={{ width: 86, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={positive ? "#0f9f6e" : "#d64545"} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriceChart({ data }: { data: Candle[] }) {
  const domain = paddedDomain(data, ["low", "high", "close"], { padding: 0.08 });
  return (
    <div style={{ height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="price" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#435ebe" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#435ebe" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6" />
          <XAxis dataKey="time" minTickGap={34} tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis
            domain={domain}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            width={72}
            tickFormatter={(value) => formatAxis(Number(value))}
          />
          <Tooltip />
          <Area type="monotone" dataKey="close" stroke="#435ebe" fill="url(#price)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const priceLikeMetrics: IndicatorKey[] = [
  "sma20",
  "ema20",
  "bollingerUpper",
  "bollingerMiddle",
  "bollingerLower"
];

function indicatorDomain(metric: IndicatorKey, data: IndicatorPoint[]): [number | "auto", number | "auto"] | [number, number] {
  if (metric === "rsi14" || metric === "stochasticK") return [0, 100];
  if (metric === "volumeTrend") return paddedDomain(data, [metric], { includeZero: true, padding: 0.12 });
  if (metric === "macd") return paddedDomain(data, ["macd", "macdSignal"], { includeZero: true, symmetricAroundZero: true });
  if (metric === "macdSignal" || metric === "roc12" || metric === "momentum10") {
    return paddedDomain(data, [metric], { includeZero: true, padding: 0.12 });
  }
  return paddedDomain(data, [metric], { padding: 0.08 });
}

function referenceLines(metric: IndicatorKey) {
  if (metric === "rsi14") return [30, 50, 70];
  if (metric === "stochasticK") return [20, 50, 80];
  if (metric === "roc12" || metric === "momentum10" || metric === "macd" || metric === "macdSignal") return [0];
  if (metric === "volumeTrend") return [100];
  return [];
}

export function IndicatorChart({
  data,
  metric,
  label
}: {
  data: IndicatorPoint[];
  metric: IndicatorKey;
  label: string;
}) {
  const priceLike = priceLikeMetrics.includes(metric);
  const priceDomain = priceLike
    ? paddedDomain(data, ["close", metric, "bollingerMiddle", "bollingerLower"], { padding: 0.08 })
    : undefined;
  return (
    <div style={{ height: 390 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6" />
          <XAxis dataKey="time" minTickGap={34} tick={{ fill: "#6b7280", fontSize: 12 }} />
          {priceLike ? (
            <YAxis
              yAxisId="indicator"
              domain={priceDomain}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              width={74}
              tickFormatter={(value) => formatAxis(Number(value))}
            />
          ) : (
            <YAxis
              yAxisId="indicator"
              domain={indicatorDomain(metric, data)}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              width={70}
              tickFormatter={(value) => formatAxis(Number(value))}
            />
          )}
          <Tooltip
            formatter={(value, name) => [
              Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
              name === metric ? label : "Close"
            ]}
          />
          {priceLike ? (
            <Line yAxisId="indicator" type="monotone" dataKey="close" stroke="#9ca3af" dot={false} strokeWidth={1.4} />
          ) : null}
          {referenceLines(metric).map((value) => (
            <ReferenceLine
              yAxisId="indicator"
              y={value}
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              key={value}
            />
          ))}
          <Line
            yAxisId="indicator"
            type="monotone"
            dataKey={metric}
            name={label}
            stroke="#0f9f6e"
            dot={false}
            activeDot={{ r: 4 }}
            strokeWidth={2.4}
            connectNulls
          />
          {metric === "macd" ? (
            <Line
              yAxisId="indicator"
              type="monotone"
              dataKey="macdSignal"
              name="MACD Signal"
              stroke="#435ebe"
              dot={false}
              strokeWidth={1.8}
              connectNulls
            />
          ) : null}
          {metric === "bollingerUpper" ? (
            <>
              <Line yAxisId="indicator" type="monotone" dataKey="bollingerMiddle" name="Bollinger Mid" stroke="#435ebe" dot={false} strokeWidth={1.8} connectNulls />
              <Line yAxisId="indicator" type="monotone" dataKey="bollingerLower" name="Bollinger Lower" stroke="#d64545" dot={false} strokeWidth={1.8} connectNulls />
            </>
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MovingAverageChart({ data }: { data: IndicatorPoint[] }) {
  const domain = paddedDomain(data, ["close", "sma20", "ema20"], { padding: 0.08 });
  return (
    <div style={{ height: 390 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6" />
          <XAxis dataKey="time" minTickGap={34} tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis domain={domain} tick={{ fill: "#6b7280", fontSize: 12 }} width={74} tickFormatter={(value) => formatAxis(Number(value))} />
          <Tooltip
            formatter={(value, name) => [
              Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
              name === "close" ? "Close" : name === "sma20" ? "SMA 20" : "EMA 20"
            ]}
          />
          <Line type="monotone" dataKey="close" name="Close" stroke="#9ca3af" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="sma20" name="SMA 20" stroke="#435ebe" dot={false} strokeWidth={2.2} connectNulls />
          <Line type="monotone" dataKey="ema20" name="EMA 20" stroke="#0f9f6e" dot={false} strokeWidth={2.2} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
