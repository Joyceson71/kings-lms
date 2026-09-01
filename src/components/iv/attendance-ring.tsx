'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function AttendanceRing({ percentage }: { percentage: number }) {
  const data = [
    { name: 'Attended', value: percentage },
    { name: 'Missed', value: 100 - percentage },
  ];
  
  // Green if >= 75%, red if < 75%
  const color = percentage >= 75 ? '#22c55e' : '#ef4444';
  const COLORS = [color, 'transparent'];

  return (
    <div className="relative w-24 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={40}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className={`text-lg font-bold ${percentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      {/* Background ring */}
      <svg className="absolute inset-0 w-full h-full -z-10 pointer-events-none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="10" className="text-secondary/50" />
      </svg>
    </div>
  );
}
