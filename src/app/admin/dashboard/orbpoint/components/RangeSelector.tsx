import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RangeOption } from "../utils";

export function RangeSelector({
  range,
  setRange,
}: {
  range: RangeOption;
  setRange: (r: RangeOption) => void;
}) {
  return (
    <Select
      value={range}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onValueChange={(value) => setRange(value as RangeOption)}
    >
      <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto">
        <SelectValue placeholder="Selecciona rango" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        <SelectItem value="1D">Últimas 24 horas</SelectItem>
        <SelectItem value="1W">Últimos 7 días</SelectItem>
        <SelectItem value="1M">Últimos 30 días</SelectItem>
        <SelectItem value="3M">Últimos 3 meses</SelectItem>
        <SelectItem value="6M">Últimos 6 meses</SelectItem>
        <SelectItem value="1Y">Último año</SelectItem>
        <SelectItem value="ALL">Todos</SelectItem>
        <SelectItem value="DAY">Día específico</SelectItem>
      </SelectContent>
    </Select>
  );
}
