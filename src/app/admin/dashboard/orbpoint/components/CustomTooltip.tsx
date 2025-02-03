/* eslint-disable @typescript-eslint/no-explicit-any */
import { TooltipProps } from "recharts";

export function CustomTooltip({
  active,
  label,
  payload,
}: TooltipProps<any, any>) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // label = chartData[index].date
  // payload[0].value = chartData[index].count
  return (
    <div className="p-2 rounded-sm bg-white border shadow-sm text-gray-700 bg-opacity-80">
      <p className="font-semibold">Fecha/Hora: {label}</p>
      <p>Respuestas: {payload[0].value}</p>
    </div>
  );
}
