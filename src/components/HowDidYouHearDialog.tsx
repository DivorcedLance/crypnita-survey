"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HowDidYouHearDialog({ data }: { data: any[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Ver gráfico: ¿Cómo se enteró de nosotros?</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cómo se enteró de nosotros?</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <PieChart width={500} height={500}>
            <Pie
              data={data}
              dataKey="count"
              nameKey="text"
              cx="50%"
              cy="50%"
              outerRadius={150}
              fill="#8884d8"
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </DialogContent>
    </Dialog>
  );
}
