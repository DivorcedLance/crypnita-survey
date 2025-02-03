"use client";

import React, { useState, useEffect } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, Tooltip } from "recharts";
import { Timestamp } from "firebase/firestore";

import { Card, CardContent } from "@/components/ui/card";
import { SurveyResponse } from "@/types";
import { RangeOption } from "@/app/admin/dashboard/orbpoint/utils";
import { CustomTooltip } from "@/app/admin/dashboard/orbpoint/components/CustomTooltip";

type ChartDataPoint = {
  date: string;
  count: number;
};

export default function StatsComponent({
  responses,
  timeRange,
  selectedDate,
}: {
  responses: SurveyResponse[];
  timeRange: RangeOption;
  selectedDate?: Date | null;
}) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const transformed = transformData(responses, timeRange, selectedDate);
    setChartData(transformed);
  }, [timeRange, responses, selectedDate]);

  return (
    <Card className="mt-6">
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex justify-center">
        <AreaChart width={600} height={300} data={chartData}>
          <defs>
            <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            dataKey="count"
            type="monotone"
            stroke="#8884d8"
            fill="url(#fillCount)"
          />
        </AreaChart>
      </CardContent>
    </Card>
  );
}

function transformData(
  allResponses: SurveyResponse[],
  timeRange: RangeOption,
  selectedDate?: Date | null
): ChartDataPoint[] {
  const endDate = new Date();
  if (timeRange === "DAY" && selectedDate) {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const slots: { dateObj: Date; label: string; count: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const slotDate = new Date(start);
      slotDate.setHours(start.getHours() + i);

      const hh = slotDate.getHours().toString().padStart(2, "0");
      const label = `${hh}:00`;

      slots.push({ dateObj: slotDate, label, count: 0 });
    }

    const relevant = allResponses.filter((resp) => {
      if (!resp.timestamp) return false;
      const d =
        resp.timestamp instanceof Timestamp
          ? resp.timestamp.toDate()
          : resp.timestamp;

      return d >= start && d <= end;
    });

    relevant.forEach((resp) => {
      const d =
        resp.timestamp instanceof Timestamp
          ? resp.timestamp.toDate()
          : resp.timestamp;
      const diffMs = d.getTime() - start.getTime();
      const offsetHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (offsetHours >= 0 && offsetHours < 24) {
        slots[offsetHours].count++;
      }
    });

    return slots.map((slot) => ({
      date: slot.label,
      count: slot.count,
    }));
  }

  if (timeRange === "1D") {
    const start = new Date(endDate);
    start.setHours(start.getHours() - 24, 0, 0, 0);

    const slots: { dateObj: Date; label: string; count: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const slotDate = new Date(start);
      slotDate.setHours(start.getHours() + i);

      const hh = slotDate.getHours().toString().padStart(2, "0");
      const label = `${hh}:00`;

      slots.push({ dateObj: slotDate, label, count: 0 });
    }

    const relevant = allResponses.filter((resp) => {
      if (!resp.timestamp) return false;
      const d =
        resp.timestamp instanceof Timestamp
          ? resp.timestamp.toDate()
          : (resp.timestamp as Date);

      return d >= start && d <= endDate;
    });

    relevant.forEach((resp) => {
      const d =
        resp.timestamp instanceof Timestamp
          ? resp.timestamp.toDate()
          : resp.timestamp;
      const diffMs = d.getTime() - start.getTime();
      const offsetHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (offsetHours >= 0 && offsetHours < 24) {
        slots[offsetHours].count++;
      }
    });

    return slots.map((slot) => ({
      date: slot.label,
      count: slot.count,
    }));
  }

  const startDate = new Date(endDate);
  switch (timeRange) {
    case "1W":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "1M":
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "3M":
      startDate.setDate(endDate.getDate() - 90);
      break;
    case "6M":
      startDate.setDate(endDate.getDate() - 180);
      break;
    case "1Y":
      startDate.setDate(endDate.getDate() - 365);
      break;
    case "ALL":
      return [];
  }

  const relevant = allResponses.filter((resp) => {
    if (!resp.timestamp) return false;
    const d =
      resp.timestamp instanceof Timestamp
        ? resp.timestamp.toDate()
        : resp.timestamp;
    return d >= startDate && d <= endDate;
  });

  const dateMap: Record<string, number> = {};

  relevant.forEach((resp) => {
    const d =
      resp.timestamp instanceof Timestamp
        ? resp.timestamp.toDate()
        : resp.timestamp;
    const key = d.toISOString().slice(0, 10);
    dateMap[key] = (dateMap[key] || 0) + 1;
  });
  const sortedKeys = Object.keys(dateMap).sort();
  return sortedKeys.map((k) => ({
    date: k,
    count: dateMap[k],
  }));
}
