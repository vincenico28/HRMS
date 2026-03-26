import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Engineering", value: 42, color: "hsl(217, 91%, 40%)" },
  { name: "HR", value: 18, color: "hsl(172, 66%, 40%)" },
  { name: "Finance", value: 24, color: "hsl(38, 92%, 50%)" },
  { name: "Marketing", value: 31, color: "hsl(142, 71%, 40%)" },
  { name: "Operations", value: 28, color: "hsl(0, 72%, 51%)" },
  { name: "IT", value: 13, color: "hsl(199, 89%, 48%)" },
];

export function DepartmentChart() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-card-foreground mb-4">Department Overview</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-muted-foreground ml-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
