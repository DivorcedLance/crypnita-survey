"use client";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/db/firebaseConnection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { OrbPoint, SurveyResponse } from "@/types";
import HowDidYouHearDialog from "@/components/HowDidYouHearDialog";
import VisitingFromDialog from "@/components/VisitingFormDialog";

export default function OrbpointPage({ params }: { params: { id: string } }) {
  const [orbPoint, setOrbPoint] = useState<OrbPoint | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const totalResponses = surveyResponses.length;

  const calculateStats = (
    field: string,
    options?: { id: string; text: string }[]
  ) => {
    const counts = surveyResponses.reduce(
      (acc: Record<string, number>, response) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <h2 className="text-lg font-semibold mb-4">
              Total de respuestas: {totalResponses}
            </h2>
            <div className="flex justify-between my-4">
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

            <div className="flex justify-between mt-8 mb-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
