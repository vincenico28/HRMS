import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { day: "Mon", present: 142, absent: 6, late: 8 },
  { day: "Tue", present: 138, absent: 10, late: 8 },
  { day: "Wed", present: 145, absent: 5, late: 6 },
  { day: "Thu", present: 140, absent: 8, late: 8 },
  { day: "Fri", present: 136, absent: 12, late: 8 },
];

export function AttendanceOverview() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-card-foreground mb-4">Weekly Attendance</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Bar dataKey="present" fill="hsl(142, 71%, 40%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="late" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
