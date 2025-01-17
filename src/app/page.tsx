"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from '@/components/theme-toggle'
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, User } from 'lucide-react'
import type { Operator, OrbPoint, SurveyOption } from '@/types'
import { getOrbPointById } from '@/lib/db/orbPoint'
import { postSurveyResponse } from '@/lib/db/survey'
import { collection, getDocs, query, where } from "firebase/firestore"
import { db, auth } from "@/lib/db/firebaseConnection"
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  const [operator, setOperator] = useState<Operator | null>(null)
  const [orbpoint, setOrbpoint] = useState<OrbPoint | null>(null)
  const [howDidYouHearOptions, setHowDidYouHearOptions] = useState<SurveyOption[]>([])
  const [cryptoOptions, setCryptoOptions] = useState<SurveyOption[]>([])
  const [selectedSource, setSelectedSource] = useState("")
  const [selectedSector, setSelectedSector] = useState("")
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>([])
  const [contactNumber, setContactNumber] = useState("")

  useEffect(() => {

    const checkOperator = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push("/auth/login")
        return
      }

      const userDoc = await getDocs(
        query(collection(db, "User"), where("email", "==", user.email))
      )

      if (userDoc.docs[0]?.data()?.role === "admin") {
        router.push("/admin/dashboard")
      }

      const operatorDoc = await getDocs(
        query(collection(db, "Operator"), where("userDataId", "==", userDoc.docs[0].id))
      )

      return {id: operatorDoc.docs[0].id, userData: userDoc.docs[0]?.data(), ...operatorDoc.docs[0].data()} as Operator
    }

    const fetchData = async () => {
      try {
        checkOperator().then((data) => {
          setOperator(data!);
          if (!data) {
            alert("No se encontró el operador.");
            return;
          }
          if (!data.orbPointId) {
            alert("El operador no tiene un OrbPoint asignado.");
            return;
          }
          getOrbPointById(data!.orbPointId).then((data) => {
            setOrbpoint(data!);
          });
        });
  
        setHowDidYouHearOptions([
          { id: "1", text: "Redes sociales" },
          { id: "2", text: "Recomendación de un amigo" },
          { id: "3", text: "Anuncio" },
          { id: "4", text: "Evento o activación" },
        ]);
  
        setCryptoOptions([
          { id: "1", text: "Sí" },
          { id: "2", text: "No" },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Hubo un problema al cargar la información.");
      }
    };

    fetchData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implement survey submission to Firebase
    await postSurveyResponse({
      howDidYouHearAbout: selectedSource,
      visitingFrom: selectedSector,
      interestedCrypto: selectedCryptos,
      contactNumber,
      operatorId: operator!.id!,
      orbPointId: operator!.orbPointId!,
      timestamp: new Date()
    })

    alert("Encuesta enviada con éxito.")

    setSelectedSource("")
    setSelectedSector("")
    setSelectedCryptos([])
    setContactNumber("")
  }

  if (!operator || !orbpoint) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Encuesta OrbPoint</h1>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información del OrbPoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium">Nombre:</dt>
                  <dd>{orbpoint.name}</dd>
                </div>
                <div>
                  <dt className="font-medium">Tipo de área:</dt>
                  <dd>{orbpoint.areaType}</dd>
                </div>
                <div>
                  <dt className="font-medium">Dirección:</dt>
                  <dd>{orbpoint.direction}</dd>
                </div>
                <div>
                  <dt className="font-medium">Región:</dt>
                  <dd>{orbpoint.region}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Operador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium">Nombre:</dt>
                  <dd>{operator.userData.firstname} {operator.userData.lastname}</dd>
                </div>
                <div>
                  <dt className="font-medium">Documento:</dt>
                  <dd>{operator.userData.nDoc}</dd>
                </div>
                <div>
                  <dt className="font-medium">Email:</dt>
                  <dd>{operator.userData.email}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Encuesta al Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>¿Cómo se enteró de nosotros?</Label>
                <RadioGroup value={selectedSource} onValueChange={setSelectedSource}>
                  {howDidYouHearOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={`source-${option.id}`} />
                      <Label htmlFor={`source-${option.id}`}>{option.text}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label>¿De dónde nos estás visitando?</Label>
                <RadioGroup value={selectedSector} onValueChange={setSelectedSector}>
                  {orbpoint.sectors.map((sector, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={sector.sectorName} id={`sector-${index}`} />
                      <Label htmlFor={`sector-${index}`}>{sector.sectorName} ({sector.sectorType})</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

                <div className="space-y-4">
                <Label>¿Le interesa el mundo crypto?</Label>
                <RadioGroup value={selectedCryptos.join(',')} onValueChange={(value) => setSelectedCryptos(value.split(','))}>
                  {cryptoOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`crypto-${option.id}`} />
                    <Label htmlFor={`crypto-${option.id}`}>{option.text}</Label>
                  </div>
                  ))}
                </RadioGroup>
                </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Número de contacto</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ingrese número de teléfono"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                Enviar Encuesta
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}