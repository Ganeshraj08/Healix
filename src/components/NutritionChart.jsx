import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const NutritionChart = ({ data }) => {
  return (
    <div className="w-full h-64 mt-6">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="calories"
            stroke="#4F46E5"
            name="Calories"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="protein"
            stroke="#34D399"
            name="Protein (g)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
