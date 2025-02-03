/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/db/firebaseConnection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { OrbPoint, SurveyResponse } from "@/types";
import HowDidYouHearDialog from "@/components/HowDidYouHearDialog";
import VisitingFromDialog from "@/components/VisitingFormDialog";
import { getRangeDates, RangeOption } from "../utils";
import { RangeSelector } from "../components/RangeSelector";
import StatsComponent from "@/components/StatsComponent";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function OrbpointPage({ params }: { params: { id: string } }) {
  const [orbPoint, setOrbPoint] = useState<OrbPoint | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [filteredSurveyResponses, setFilteredSurveyResponses] = useState<
    SurveyResponse[]
  >([]);
  const [range, setRange] = useState<RangeOption>("1D");
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const howDidYouHearOptions = [
    { id: "1", text: "Redes sociales" },
    { id: "2", text: "Recomendación de un amigo" },
    { id: "3", text: "Anuncio" },
    { id: "4", text: "Evento o activación" },
    { id: "5", text: "Promotor" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch OrbPoint data
        const orbPointRef = doc(db, "OrbPoint", params.id);
        const orbPointSnap = await getDoc(orbPointRef);

        if (!orbPointSnap.exists()) {
          throw new Error("OrbPoint no encontrado");
        }
        setOrbPoint(orbPointSnap.data() as OrbPoint);

        // Fetch related survey responses
        const surveysQuery = query(
          collection(db, "SurveyResponse"),
          where("orbPointId", "==", params.id)
        );
        const surveySnap = await getDocs(surveysQuery);
        const surveys = surveySnap.docs.map(
          (doc) => doc.data() as SurveyResponse
        );

        setSurveyResponses(surveys);
      } catch (err) {
        console.error(err);
        setError("Error al cargar datos");
      }
    };

    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (surveyResponses.length === 0) return;
    const [start, end] = getRangeDates(range);

    if (start === "ALL") {
      setFilteredSurveyResponses(surveyResponses);
      console.log({ surveyResponses, range, start, end });
      return;
    }

    if (start === "DAY") {
      if (!selectedDate) return;
      const filtered = surveyResponses.filter((resp) => {
        const t =
          resp.timestamp instanceof Timestamp
            ? resp.timestamp.toDate()
            : resp.timestamp;
        return (
          t.getDate() === selectedDate.getDate() &&
          t.getMonth() === selectedDate.getMonth() &&
          t.getFullYear() === selectedDate.getFullYear()
        );
      });
      console.log({ filtered, surveyResponses, selectedDate, start, end });
      setFilteredSurveyResponses(filtered);
      return;
    }

    const filtered = surveyResponses.filter((resp) => {
      if (!resp.timestamp) return false;
      const t =
        resp.timestamp instanceof Timestamp
          ? resp.timestamp.toDate()
          : resp.timestamp;
      return t >= start && t <= end;
    });

    console.log({ filtered, surveyResponses, range, start, end });

    setFilteredSurveyResponses(filtered);
  }, [surveyResponses, range, selectedDate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!orbPoint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        ...Cargando
      </div>
    );
  }

  const totalResponses = filteredSurveyResponses.length;

  const calculateStats = (
    field: string,
    options?: { id: string; text: string }[]
  ) => {
    const counts = filteredSurveyResponses.reduce(
      (acc: Record<string, number>, response) => {
        const value = (response as any)[field];
        if (value) {
          acc[value] = (acc[value] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    if (options) {
      return options.map((option) => ({
        text: option.text,
        count: counts[option.id] || 0,
        percentage: totalResponses
          ? ((counts[option.id] || 0) / totalResponses) * 100
          : 0,
      }));
    }

    return Object.entries(counts).map(([key, count]) => ({
      text: key,
      count,
      percentage: totalResponses ? (count / totalResponses) * 100 : 0,
    }));
  };

  const howDidYouHearStats = calculateStats(
    "howDidYouHearAbout",
    howDidYouHearOptions
  );
  const visitingFromStats = calculateStats("visitingFrom");

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de {orbPoint.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="my-4 text-lg flex flex-wrap justify-between items-center">
              <h2>Seleccione el rango de fechas que desea ver</h2>
              <div>
                <RangeSelector range={range} setRange={setRange} />
                {range === "DAY" && (
                  <div className="mt-2 flex items-center gap-2">
                    <Label>Seleccionar día:</Label>
                    <Input
                      type="date"
                      onChange={(e) => {
                        if (!e.target.value) {
                          setSelectedDate(null);
                          return;
                        }
                        // Convertir 'yyyy-mm-dd' a Date
                        const [year, month, day] = e.target.value.split("-");
                        const dateObj = new Date(
                          Number(year),
                          Number(month) - 1,
                          Number(day),
                          0,
                          0,
                          0,
                          0
                        );
                        setSelectedDate(dateObj);
                      }}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-4">
              Total de respuestas: {totalResponses}
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-center my-6">
              <h2 className="text-lg font-semibold">
                ¿Cómo se enteró de nosotros?
              </h2>
              <HowDidYouHearDialog data={howDidYouHearStats} />
            </div>
            <ul className="space-y-2">
              {howDidYouHearStats.map((stat) => (
                <li key={stat.text} className="flex justify-between">
                  <span>{stat.text}</span>
                  <span>
                    {stat.count} ({stat.percentage.toFixed(2)}%)
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col md:flex-row justify-between items-center mt-8 mb-6">
              <h2 className="text-lg font-semibold">
                ¿De dónde nos estás visitando?
              </h2>
              <VisitingFromDialog data={visitingFromStats} />
            </div>
            <ul className="space-y-2">
              {visitingFromStats.map((stat) => (
                <li key={stat.text} className="flex justify-between">
                  <span>{stat.text}</span>
                  <span>
                    {stat.count} ({stat.percentage.toFixed(2)}%)
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col md:flex-row justify-between items-center mt-8 mb-6">
              <h2 className="text-lg font-semibold">Estadísticas detalladas</h2>
            </div>
            <StatsComponent
              responses={surveyResponses}
              timeRange={range}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
