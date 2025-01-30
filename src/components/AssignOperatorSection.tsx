"use client";

import { useState, useEffect } from "react";
import {
  fetchPromotersWithoutOrbPoint,
  assignPromoterToOrbPoint,
} from "@/lib/db/operator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "./ui/input";

interface Props {
  orbPointId: string;
  onAssigned?: () => void;
  refreshKey?: number;
}

export function AssignPromoterSection({
  orbPointId,
  onAssigned,
  refreshKey = 0,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [promoters, setPromoters] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadPromoters() {
    try {
      const data = await fetchPromotersWithoutOrbPoint();
      setPromoters(data);
    } catch (err) {
      console.error(err);
      alert("Error al cargar promotores disponibles.");
    }
  }

  useEffect(() => {
    loadPromoters();
  }, [refreshKey]);

  const handleAssign = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      for (const promoterId of selected) {
        await assignPromoterToOrbPoint(promoterId, orbPointId);
      }
      alert("Promotores asignados con éxito.");

      setPromoters((prev) => prev.filter((p) => !selected.includes(p.id)));
      setSelected([]);

      if (onAssigned) onAssigned();
    } catch (error) {
      console.error("Error asignando promotores:", error);
      alert("No se pudieron asignar los promotores.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (promId: string) => {
    if (selected.includes(promId)) {
      setSelected((prev) => prev.filter((id) => id !== promId));
    } else {
      setSelected((prev) => [...prev, promId]);
    }
  };

  const filteredPromoters = promoters.filter((p) => {
    const alreadySelected = selected.includes(p.id);
    const emailMatches = p.userData.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Retorna true si coincide el filter o si ya está seleccionado
    return alreadySelected || emailMatches;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Promotores Disponibles</h3>

        <Input
          className="w-2/3"
          placeholder="Filtrar por email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {filteredPromoters.length === 0 ? (
        <p>No hay promotores libres en este momento.</p>
      ) : (
        <>
          {filteredPromoters.map((prom) => (
            <div key={prom.id} className="flex items-center gap-2">
              <Checkbox
                checked={selected.includes(prom.id)}
                onCheckedChange={() => toggleCheck(prom.id)}
                id={`promoter-${prom.id}`}
              />
              <label htmlFor={`promoter-${prom.id}`} className="cursor-pointer">
                {prom.userData.firstname} {prom.userData.lastname} (
                {prom.userData.email})
              </label>
            </div>
          ))}
          <Button
            onClick={handleAssign}
            disabled={selected.length === 0 || loading}
          >
            {loading ? "Asignando..." : "Asignar Seleccionados"}
          </Button>
        </>
      )}
    </div>
  );
}
