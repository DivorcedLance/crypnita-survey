"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, where, addDoc } from "firebase/firestore"
import { auth, db } from "@/lib/db/firebaseConnection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { OrbPoint, Operator } from "@/types"
import { asignOperatorToOrbPoint, deleteOperator, getOperators } from "@/lib/db/operator"
import { deleteOrbPoint, getOrbPoints } from "@/lib/db/orbPoint"
import { DialogDescription } from "@radix-ui/react-dialog"
import { useAuth } from "@/hooks/use-auth"

export default function AdminDashboard() {
  const router = useRouter()
  const [orbPoints, setOrbPoints] = useState<OrbPoint[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [newOrbPoint, setNewOrbPoint] = useState({
    name: "",
    areaType: "",
    direction: "",
    region: "",
    sectors: [{ sectorName: "", sectorType: "" }],
    operatorId: "",
  })

  const { user: userAuth } = useAuth()
  console.log("userAuth", userAuth)

  useEffect(() => {

    const checkAdmin = async () => {

      const user = auth.currentUser
      console.log("user", user)

      if (!user) {
        router.push("/auth/login")
        return
      }

      const userDoc = await getDocs(
        query(collection(db, "User"), where("email", "==", user.email))
      )

      if (userDoc.docs[0]?.data()?.role === "operator") {
        router.push("/")
      }
    }

    const fetchData = async () => {
      try {
        const [orbPointsData, operatorsData] = await Promise.all([
          getOrbPoints(),
          getOperators(),
        ])

        if (!orbPointsData || !operatorsData) {
          throw new Error("Failed to fetch data")
        }

        if (orbPointsData.length !== 0) {
          setOrbPoints(orbPointsData)
        }

        if (operatorsData.length !== 0) {
          setOperators(operatorsData)
        }

      } catch (err) {
        console.error(err)
        setError("Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
    fetchData()
  }, [router])

  const handleAddSector = () => {
    setNewOrbPoint({
      ...newOrbPoint,
      sectors: [...newOrbPoint.sectors, { sectorName: "", sectorType: "" }],
    })
  }

  const handleSectorChange = (index: number, field: string, value: string) => {
    const updatedSectors = [...newOrbPoint.sectors]
    updatedSectors[index] = {
      ...updatedSectors[index],
      [field]: value,
    }
    setNewOrbPoint({ ...newOrbPoint, sectors: updatedSectors })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const newOrbPointDoc = await addDoc(collection(db, "OrbPoint"), {
        ...newOrbPoint,
        createdAt: new Date().toISOString(),
      })

      // Assign operator to the new OrbPoint
      if (newOrbPoint.operatorId) {
        await asignOperatorToOrbPoint(newOrbPoint.operatorId, newOrbPointDoc.id)
      }

      // Reset form and refresh data
      setNewOrbPoint({
        name: "",
        areaType: "",
        direction: "",
        region: "",
        sectors: [{ sectorName: "", sectorType: "" }],
        operatorId: "",
      })
      
      // Refresh the orbPoints list
      const orbPointsData = await getOrbPoints()
      if (!orbPointsData) {
        throw new Error("Failed to fetch data")
      }

      setOrbPoints(orbPointsData)

    } catch (err) {
      console.error(err)
      setError("Failed to create OrbPoint")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
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
            <DialogContent className="max-w-2xl">
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
                        setNewOrbPoint({ ...newOrbPoint, areaType: e.target.value })
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
                      setNewOrbPoint({ ...newOrbPoint, direction: e.target.value })
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
                          handleSectorChange(index, "sectorName", e.target.value)
                        }
                        required
                      />
                      <Input
                        placeholder="Tipo de sector"
                        value={sector.sectorType}
                        onChange={(e) =>
                          handleSectorChange(index, "sectorType", e.target.value)
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const updatedSectors = newOrbPoint.sectors.filter(
                            (_, i) => i !== index
                          )
                          setNewOrbPoint({ ...newOrbPoint, sectors: updatedSectors })
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
                  <Label htmlFor="operator">Asignar Operador</Label>
                  <Select
                    value={newOrbPoint.operatorId}
                    onValueChange={(value: string) => {
                      setNewOrbPoint({ ...newOrbPoint, operatorId: value })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((operator) => (
                        <SelectItem key={operator.id!} value={operator.id!}>
                          {operator.userData.firstname} {operator.userData.lastname} ({operator.userData.nDoc})
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
                  <TableHead>Operador</TableHead>
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
                          await asignOperatorToOrbPoint(newOperatorId, orbPoint.id!);

                          const orbPointsData = await getOrbPoints()
                          if (!orbPointsData) {
                            throw new Error("Failed to fetch data")
                          }
                          setOrbPoints(orbPointsData)

                        } catch (error) {
                          console.error("Error updating operator:", error);
                          setError("Failed to update operator");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder="Selecciona un operador"
                        >
                          {
                            operators.find((op) => op.id === orbPoint.operatorId)
                              ? `${operators.find((op) => op.id === orbPoint.operatorId)?.userData.firstname} ${
                                  operators.find((op) => op.id === orbPoint.operatorId)?.userData.lastname
                                }`
                              : "Sin asignar"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((operator) => (
                          <SelectItem key={operator.id!} value={operator.id!}>
                            {operator.userData.firstname} {operator.userData.lastname} ({operator.userData.nDoc})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell>
                      {/* Button to delete */}
                      <Button className="bg-red-500" onClick={async () => {
                        await deleteOrbPoint(orbPoint.id!)
                        setOrbPoints(orbPoints.filter((op) => op.id !== orbPoint.id))
                      }}>Borrar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Operadores</CardTitle>
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
                    <TableCell>{operator.userData.firstname} {operator.userData.lastname}</TableCell>
                    <TableCell>{operator.userData.nDoc}</TableCell>
                    <TableCell>{operator.userData.email}</TableCell>
                    <TableCell>
                      <Button
                        onClick={async () => {
                          await deleteOperator(operator.id!)
                          setOperators(operators.filter((op) => op.id !== operator.id))
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
  )
}