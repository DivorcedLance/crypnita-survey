import { SurveyResponse } from "@/types";

export function DayHourChart({ responses }: { responses: SurveyResponse[] }) {
  const hoursMap = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0,
  }));

  responses.forEach((resp) => {
    const date =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (resp.timestamp as any)?.toDate?.() ?? new Date(resp.timestamp);
    const h = date.getHours();
    hoursMap[h].count += 1;
  });

  return (
    <div className="bg-card p-4 rounded mt-4">
      <h3 className="text-lg font-semibold">
        Respuestas por hora (último día)
      </h3>
      <ul>
        {hoursMap.map(({ hour, count }) => (
          <li key={hour} className="flex justify-between">
            <span>{hour}:00</span>
            <span>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
