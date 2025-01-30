/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/db/firebaseConnection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Plus, UserRoundCog } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { OrbPoint, Operator } from "@/types";
import {
  asignOperatorToOrbPoint,
  deleteOperator,
  fetchPromotersWithoutOrbPoint,
  getOperators,
} from "@/lib/db/operator";
import { deleteOrbPoint, getOrbPoints } from "@/lib/db/orbPoint";
import { DialogDescription } from "@radix-ui/react-dialog";
import Link from "next/link";
import { createSupervisorAction } from "./actions";

export default function AdminDashboard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orbPoints, setOrbPoints] = useState<OrbPoint[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newOrbPoint, setNewOrbPoint] = useState({
    name: "",
    areaType: "",
    direction: "",
    region: "",
    sectors: [{ sectorName: "", sectorType: "" }],
    operatorId: "",
  });

  const [newOperator, setNewOperator] = useState({
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    nDoc: "",
  });

  const [selectedOrbPoint, setSelectedOrbPoint] = useState<string>("");
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([]);
  const [promotersWithoutOrbPoint, setPromotersWithoutOrbPoint] = useState<
    any[]
  >([]);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const userDoc = await getDocs(
        query(collection(db, "User"), where("email", "==", user.email))
      );

      if (userDoc.docs[0]?.data()?.role === "operator") {
        router.push("/");
      }
    };

    const fetchData = async () => {
      try {
        const [orbPointsData, operatorsData] = await Promise.all([
          getOrbPoints(),
          getOperators(),
        ]);

        if (!orbPointsData || !operatorsData) {
          throw new Error("Failed to fetch data");
        }

        if (orbPointsData.length !== 0) {
          setOrbPoints(orbPointsData);
        }

        if (operatorsData.length !== 0) {
          setOperators(operatorsData);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
    fetchData();
  }, [router]);

  useEffect(() => {
    const fetchPromoters = async () => {
      try {
        const promoters = await fetchPromotersWithoutOrbPoint();
        setPromotersWithoutOrbPoint(promoters);
      } catch {
        alert("Error al cargar operadores disponibles.");
      }
    };
    fetchPromoters();
  }, []);

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        await createSupervisorAction({
          email: newOperator.email,
          password: newOperator.password,
          firstname: newOperator.firstname,
          lastname: newOperator.lastname,
          nDoc: newOperator.nDoc,
        });
        // Limpia formulario
        setNewOperator({
          email: "",
          password: "",
          firstname: "",
          lastname: "",
          nDoc: "",
        });
        alert("Supervisor creado exitosamente.");
        const operatorsData = await getOperators();
        if (!operatorsData) {
          throw new Error("Failed to fetch data");
        }
        setOperators(operatorsData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error creando supervisor");
      }
    });
  };

  const handleAssignPromoters = async () => {
    try {
      for (const promoterId of selectedPromoters) {
        await asignOperatorToOrbPoint(promoterId, selectedOrbPoint);
      }

      const promoters = await fetchPromotersWithoutOrbPoint();
      setPromotersWithoutOrbPoint(promoters);

      setSelectedPromoters([]);
      setSelectedOrbPoint("");
    } catch (error) {
      console.error("Error assigning promoters:", error);
      setError("Failed to assign promoters");
    }
  };

  const handleAddSector = () => {
    setNewOrbPoint({
      ...newOrbPoint,
      sectors: [...newOrbPoint.sectors, { sectorName: "", sectorType: "" }],
    });
  };

  const handleSectorChange = (index: number, field: string, value: string) => {
    const updatedSectors = [...newOrbPoint.sectors];
    updatedSectors[index] = {
      ...updatedSectors[index],
      [field]: value,
    };
    setNewOrbPoint({ ...newOrbPoint, sectors: updatedSectors });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const newOrbPointDoc = await addDoc(collection(db, "OrbPoint"), {
        ...newOrbPoint,
        createdAt: new Date().toISOString(),
      });

      // Assign operator to the new OrbPoint
      if (newOrbPoint.operatorId) {
        await asignOperatorToOrbPoint(
          newOrbPoint.operatorId,
          newOrbPointDoc.id
        );
      }

      // Reset form and refresh data
      setNewOrbPoint({
        name: "",
        areaType: "",
        direction: "",
        region: "",
        sectors: [{ sectorName: "", sectorType: "" }],
        operatorId: "",
      });

      // Refresh the orbPoints list
      const orbPointsData = await getOrbPoints();
      if (!orbPointsData) {
        throw new Error("Failed to fetch data");
      }

      setOrbPoints(orbPointsData);
    } catch (err) {
      console.error(err);
      setError("Failed to create OrbPoint");
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/auth/login");
    } catch (err) {
      console.error(err);
      setError("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo OrbPoint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear un nuevo OrbPoint</DialogTitle>
              </DialogHeader>
              <DialogDescription />
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={newOrbPoint.name}
                      onChange={(e) =>
                        setNewOrbPoint({ ...newOrbPoint, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaType">Tipo de área</Label>
                    <Input
                      id="areaType"
                      value={newOrbPoint.areaType}
                      onChange={(e) =>
                        setNewOrbPoint({
                          ...newOrbPoint,
                          areaType: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Dirección</Label>
                  <Input
                    id="direction"
                    value={newOrbPoint.direction}
                    onChange={(e) =>
                      setNewOrbPoint({
                        ...newOrbPoint,
                        direction: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Región</Label>
                  <Input
                    id="region"
                    value={newOrbPoint.region}
                    onChange={(e) =>
                      setNewOrbPoint({ ...newOrbPoint, region: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sectores</Label>
                  {newOrbPoint.sectors.map((sector, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 mt-2">
                      <Input
                        placeholder="Nombre del sector"
                        value={sector.sectorName}
                        onChange={(e) =>
                          handleSectorChange(
                            index,
                            "sectorName",
                            e.target.value
                          )
                        }
                        required
                      />
                      <Input
                        placeholder="Tipo de sector"
                        value={sector.sectorType}
                        onChange={(e) =>
                          handleSectorChange(
                            index,
                            "sectorType",
                            e.target.value
                          )
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const updatedSectors = newOrbPoint.sectors.filter(
                            (_, i) => i !== index
                          );
                          setNewOrbPoint({
                            ...newOrbPoint,
                            sectors: updatedSectors,
                          });
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSector}
                    className="mt-2"
                  >
                    Agregar Sector
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operator">Asignar Supervisor</Label>
                  <Select
                    value={newOrbPoint.operatorId}
                    onValueChange={(value: string) => {
                      setNewOrbPoint({ ...newOrbPoint, operatorId: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((operator) => (
                        <SelectItem key={operator.id!} value={operator.id!}>
                          {operator.userData.firstname}{" "}
                          {operator.userData.lastname} ({operator.userData.nDoc}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  Crear OrbPoint
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Supervisor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Supervisor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOperator} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Email"
                    value={newOperator.email}
                    onChange={(e) =>
                      setNewOperator({
                        ...newOperator,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    placeholder="Contraseña"
                    type="password"
                    value={newOperator.password}
                    onChange={(e) =>
                      setNewOperator({
                        ...newOperator,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nombres"
                    value={newOperator.firstname}
                    onChange={(e) =>
                      setNewOperator({
                        ...newOperator,
                        firstname: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    placeholder="Apellidos"
                    value={newOperator.lastname}
                    onChange={(e) =>
                      setNewOperator({
                        ...newOperator,
                        lastname: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Input
                  placeholder="Número de documento"
                  value={newOperator.nDoc}
                  onChange={(e) =>
                    setNewOperator({ ...newOperator, nDoc: e.target.value })
                  }
                  required
                />
                <Button disabled={isPending} type="submit" className="w-full">
                  {isPending ? "Creando..." : "Crear Supervisor"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserRoundCog className="mr-2 h-4 w-4" />
                Asignar Operadores
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Operadores a OrbPoint</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select
                  value={selectedOrbPoint}
                  onValueChange={(value) => setSelectedOrbPoint(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un OrbPoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {orbPoints.map((orbPoint) => (
                      <SelectItem key={orbPoint.id!} value={orbPoint.id!}>
                        {orbPoint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Asignar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotersWithoutOrbPoint.map((promoter) => (
                      <TableRow key={promoter.id}>
                        <TableCell>
                          {promoter.userData.firstname}{" "}
                          {promoter.userData.lastname}
                        </TableCell>
                        <TableCell>{promoter.userData.email}</TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedPromoters.includes(promoter.id!)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPromoters([
                                  ...selectedPromoters,
                                  promoter.id!,
                                ]);
                              } else {
                                setSelectedPromoters(
                                  selectedPromoters.filter(
                                    (id) => id !== promoter.id
                                  )
                                );
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button onClick={handleAssignPromoters} className="w-full">
                  Asignar Operadores
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleLogout} variant="destructive">
            Cerrar Sesión
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>OrbPoints</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombres</TableHead>
                  <TableHead>Tipo de área</TableHead>
                  <TableHead>Región</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Supervisor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orbPoints.map((orbPoint) => (
                  <TableRow key={orbPoint.name}>
                    <TableCell>{orbPoint.name}</TableCell>
                    <TableCell>{orbPoint.areaType}</TableCell>
                    <TableCell>{orbPoint.region}</TableCell>
                    <TableCell>{orbPoint.direction}</TableCell>
                    <TableCell>
                      <Select
                        value={orbPoint.operatorId || ""}
                        onValueChange={async (newOperatorId: string) => {
                          try {
                            await asignOperatorToOrbPoint(
                              newOperatorId,
                              orbPoint.id!
                            );

                            const orbPointsData = await getOrbPoints();
                            if (!orbPointsData) {
                              throw new Error("Failed to fetch data");
                            }
                            setOrbPoints(orbPointsData);
                          } catch (error) {
                            console.error("Error updating operator:", error);
                            setError("Failed to update operator");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un supervisor">
                            {operators.find(
                              (op) => op.id === orbPoint.operatorId
                            )
                              ? `${
                                  operators.find(
                                    (op) => op.id === orbPoint.operatorId
                                  )?.userData.firstname
                                } ${
                                  operators.find(
                                    (op) => op.id === orbPoint.operatorId
                                  )?.userData.lastname
                                }`
                              : "Sin asignar"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((operator) => (
                            <SelectItem key={operator.id!} value={operator.id!}>
                              {operator.userData.firstname}{" "}
                              {operator.userData.lastname} (
                              {operator.userData.nDoc})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/dashboard/orbpoint/${orbPoint.id}`}>
                        <Button>Estadísticas</Button>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {/* Button to delete */}
                      <Button
                        className="bg-red-500"
                        onClick={async () => {
                          await deleteOrbPoint(orbPoint.id!);
                          setOrbPoints(
                            orbPoints.filter((op) => op.id !== orbPoint.id)
                          );
                        }}
                      >
                        Borrar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supervisores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell>
                      {operator.userData.firstname} {operator.userData.lastname}
                    </TableCell>
                    <TableCell>{operator.userData.nDoc}</TableCell>
                    <TableCell>{operator.userData.email}</TableCell>
                    <TableCell>
                      <Button
                        onClick={async () => {
                          await deleteOperator(operator.id!);
                          setOperators(
                            operators.filter((op) => op.id !== operator.id)
                          );
                        }}
                      >
                        Borrar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
