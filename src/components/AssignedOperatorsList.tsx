/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/db/firebaseConnection";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import {
  unassignOperatorFromOrbPoint,
  deleteOperator,
} from "@/lib/db/operator";

export function AssignedOperatorsList({
  orbPointId,
  refreshKey = 0,
  setRefreshKey,
}: {
  orbPointId: string;
  refreshKey?: number;
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [promoters, setPromoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAssignedPromoters = useCallback(async () => {
    setLoading(true);
    try {
      const qRef = query(
        collection(db, "Operator"),
        where("orbPointId", "==", orbPointId)
      );
      const snap = await getDocs(qRef);

      const temp: any[] = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data();

        const userSnap = await getDoc(doc(db, "User", data.userDataId));
        if (!userSnap.exists()) {
          console.error("User not found for operator", data.userId);
          continue;
        }

        const userData = userSnap.data();
        if (!userData) {
          console.error("User data not found for operator", data.userId);
          continue;
        }

        if (userData.role !== "promoter") {
          continue;
        }

        temp.push({
          id: docSnap.id,
          userData: userData,
          orbPointId: data.orbPointId,
        });
      }
      setPromoters(temp);
    } catch (err) {
      console.error(err);
      alert("Error al cargar promotores asignados.");
    } finally {
      setLoading(false);
    }
  }, [orbPointId]);

  useEffect(() => {
    loadAssignedPromoters();
  }, [orbPointId, loadAssignedPromoters, refreshKey]);

  async function handleUnassign(promoterId: string) {
    try {
      await unassignOperatorFromOrbPoint(promoterId);
      if (setRefreshKey) {
        setRefreshKey((prev: number) => prev + 1);
      }
      // Quitar de la lista local
      setPromoters((prev) => prev.filter((p) => p.id !== promoterId));
    } catch (err) {
      console.error(err);
      alert("No se pudo desasignar el promotor.");
    }
  }

  async function handleDelete(promoterId: string) {
    try {
      await deleteOperator(promoterId);
      // Quitar de la lista local
      setPromoters((prev) => prev.filter((p) => p.id !== promoterId));
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el promotor.");
    }
  }

  if (loading) {
    return <p>Cargando promotores...</p>;
  }
  if (promoters.length === 0) {
    return <p>No hay promotores asignados a este OrbPoint.</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Promotores Asignados</h3>
      <ul className="space-y-2">
        {promoters.map((prom) => (
          <li
            key={prom.id}
            className="flex items-center justify-between p-2 bg-muted rounded"
          >
            <div>
              {prom.userData.firstname} {prom.userData.lastname} <br />
              <span className="text-sm text-muted-foreground">
                {prom.userData.email}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnassign(prom.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Desasignar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(prom.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
