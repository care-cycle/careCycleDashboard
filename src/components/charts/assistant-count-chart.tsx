import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader2 } from "lucide-react";

interface AssistantCountChartProps {
  data: {
    name: string;
    value: number;
  }[];
  isLoading?: boolean;
}

interface CustomXAxisTickProps {
  x: number;
  y: number;
  payload: {
    value: string;
  };
}

const CustomTooltip = ({ active, payload, total }: any) => {
  if (!active || !payload || !payload.length || !payload[0]) return null;

  const data = payload[0];
  const value = data.value;
  const name = data.payload.name;

  const percentage = total ? ((value / total) * 100).toFixed(1) : null;

  return (
    <div className="glass-panel bg-white/95 backdrop-blur-xl p-3 rounded-lg border border-white/20 shadow-lg">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">{name}</span>
        <span className="text-sm font-medium">
          {value.toLocaleString()} {value === 1 ? "call" : "calls"}
          {percentage && ` (${percentage}%)`}
        </span>
      </div>
    </div>
  );
};

const CustomXAxisTick = ({ x, y, payload }: CustomXAxisTickProps) => {
  // Split the label into parts for better formatting
  const parts = payload.value.split(" ");
  const maxWordsPerLine = 2;
  const lines: string[] = [];

  for (let i = 0; i < parts.length; i += maxWordsPerLine) {
    lines.push(parts.slice(i, i + maxWordsPerLine).join(" "));
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          dy={12}
          textAnchor="middle"
          fill="#64748B"
          fontSize={11}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

export function AssistantCountChart({
  data,
  isLoading,
}: AssistantCountChartProps) {
  if (isLoading) {
    return (
      <Card className="glass-panel interactive cursor-pointer h-[400px]">
        <CardHeader>
          <CardTitle className="text-gray-900">Call Types</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-65px)]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card className="glass-panel interactive cursor-pointer h-[400px]">
        <CardHeader>
          <CardTitle className="text-gray-900">Call Types</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-65px)]">
          <p className="text-gray-500">No data over selected time period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel interactive cursor-pointer h-[400px]">
      <CardHeader>
        <CardTitle className="text-gray-900">Call Types</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 h-[calc(100%-65px)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            barSize={40}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              height={60}
              interval={0}
              tick={CustomXAxisTick}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748B" }}
              tickFormatter={(value) => value.toLocaleString()}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#74E0BB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
