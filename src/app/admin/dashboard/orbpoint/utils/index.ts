export type RangeOption =
  | "1D"
  | "1W"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "ALL"
  | "CUSTOM"
  | "DAY";

export function getRangeDates(range: RangeOption) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (range) {
    case "1D":
      start.setDate(now.getDate() - 1);
      break;
    case "1W":
      start.setDate(now.getDate() - 7);
      break;
    case "1M":
      start.setMonth(now.getMonth() - 1);
      break;
    case "3M":
      start.setMonth(now.getMonth() - 3);
      break;
    case "6M":
      start.setMonth(now.getMonth() - 6);
      break;
    case "1Y":
      start.setFullYear(now.getFullYear() - 1);
      break;
    case "ALL":
      return ["ALL"];
    case "DAY":
      return ["DAY"];
    case "CUSTOM":
      break;
  }

  return [start, end];
}
