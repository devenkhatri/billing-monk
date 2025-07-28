'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface InvoiceStatusChartProps {
  data: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

const COLORS = {
  draft: '#6b7280',
  sent: '#3b82f6',
  paid: '#10b981',
  overdue: '#ef4444',
  cancelled: '#9ca3af'
};

export function InvoiceStatusChart({ data }: InvoiceStatusChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ status, count }) => `${status}: ${count}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.status as keyof typeof COLORS] || '#6b7280'} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name, props) => [
              `${value} invoices`,
              `$${props.payload.amount.toFixed(2)}`
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}