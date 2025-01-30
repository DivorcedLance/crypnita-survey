"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AssignedOperatorsList } from "./AssignedOperatorsList";
import { AssignPromoterSection } from "./AssignOperatorSection";
import { Users } from "lucide-react";

export function ManageOperatorsDialog({ orbPointId }: { orbPointId: string }) {
  const [open, setOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  function handleAssigned() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-2">
          <Users className="mr-2 h-4 w-4" />
          Administrar Promotores
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Administrar Promotores</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <AssignedOperatorsList
            orbPointId={orbPointId}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
          />

          <AssignPromoterSection
            orbPointId={orbPointId}
            onAssigned={handleAssigned}
            refreshKey={refreshKey}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
