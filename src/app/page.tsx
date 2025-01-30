"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, LogOutIcon, User } from "lucide-react";
import type { Operator, OrbPoint, SurveyOption } from "@/types";
import { getOrbPointById } from "@/lib/db/orbPoint";
import { postSurveyResponse } from "@/lib/db/survey";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/db/firebaseConnection";
import { useRouter } from "next/navigation";
import { ManageOperatorsDialog } from "@/components/ManageOperatorsDialog";

export default function Home() {
  const router = useRouter();

  const [operator, setOperator] = useState<Operator | null>(null);
  const [orbpoint, setOrbpoint] = useState<OrbPoint | null>(null);
  const [howDidYouHearOptions, setHowDidYouHearOptions] = useState<
    SurveyOption[]
  >([]);
  const [cryptoOptions, setCryptoOptions] = useState<SurveyOption[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>([]);
  const [contactNumber, setContactNumber] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const userSnap = await getDocs(
          query(collection(db, "User"), where("email", "==", user.email))
        );

        if (userSnap.empty) {
          router.push("/auth/login");
          return;
        }

        const userData = userSnap.docs[0].data();
        const role = userData.role as string;
        setUserRole(role);

        if (role === "admin") {
          router.push("/admin/dashboard");
          return;
        }

        const operatorSnap = await getDocs(
          query(
            collection(db, "Operator"),
            where("userDataId", "==", userSnap.docs[0].id)
          )
        );

        if (operatorSnap.empty) {
          setOperator(null);
          setOrbpoint(null);
          return;
        }

        const operatorData = {
          id: operatorSnap.docs[0].id,
          userData,
          ...operatorSnap.docs[0].data(),
        } as Operator;

        setOperator(operatorData);

        if (!operatorData.orbPointId) {
          setOrbpoint(null);
          return;
        }

        const orbpointFetched = await getOrbPointById(operatorData.orbPointId);
        if (!orbpointFetched) {
          setOrbpoint(null);
          return;
        }

        setOrbpoint(orbpointFetched);

        setHowDidYouHearOptions([
          { id: "1", text: "Redes sociales" },
          { id: "2", text: "Recomendación de un amigo" },
          { id: "3", text: "Anuncio" },
          { id: "4", text: "Evento o activación" },
          { id: "5", text: "Promotor" },
        ]);

        setCryptoOptions([
          { id: "1", text: "Sí" },
          { id: "2", text: "No" },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Hubo un problema al cargar la información.");
      }
    })();
  }, [router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/auth/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator || !operator.id || !operator.orbPointId) {
      alert("No tienes un OrbPoint asignado aún.");
      return;
    }

    await postSurveyResponse({
      howDidYouHearAbout: selectedSource,
      visitingFrom: selectedSector,
      interestedCrypto: selectedCryptos,
      contactNumber,
      operatorId: operator!.id!,
      orbPointId: operator!.orbPointId!,
      timestamp: new Date(),
    });

    alert("Encuesta enviada con éxito.");

    setSelectedSource("");
    setSelectedSector("");
    setSelectedCryptos([]);
    setContactNumber("");
  };

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!["admin", "operator", "promoter"].includes(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Rol no válido. Revisa tu configuración.</p>
      </div>
    );
  }

  if (operator === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2>
          No tienes un OrbPoint asignado todavía. Contacta a tu supervisor.
        </h2>
      </div>
    );
  }

  if (!operator.orbPointId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2>Aún no se te ha asignado un OrbPoint.</h2>
      </div>
    );
  }

  if (!orbpoint) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando información del OrbPoint...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Encuesta OrbPoint</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="bg-red-500 rounded-md p-1">
              <LogOutIcon
                className="h-6 w-6 cursor-pointer"
                onClick={handleLogout}
              />
            </div>
          </div>
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
              {userRole === "operator" && (
                <ManageOperatorsDialog orbPointId={orbpoint.id!} />
              )}
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
                  <dd>
                    {operator.userData.firstname} {operator.userData.lastname}
                  </dd>
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
                <RadioGroup
                  value={selectedSource}
                  onValueChange={setSelectedSource}
                >
                  {howDidYouHearOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={option.id}
                        id={`source-${option.id}`}
                      />
                      <Label htmlFor={`source-${option.id}`}>
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label>¿De dónde nos estás visitando?</Label>
                <RadioGroup
                  value={selectedSector}
                  onValueChange={setSelectedSector}
                >
                  {orbpoint.sectors.map((sector, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={sector.sectorName}
                        id={`sector-${index}`}
                      />
                      <Label htmlFor={`sector-${index}`}>
                        {sector.sectorName} ({sector.sectorType})
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label>¿Le interesa el mundo crypto?</Label>
                <RadioGroup
                  value={selectedCryptos.join(",")}
                  onValueChange={(value) =>
                    setSelectedCryptos(value.split(","))
                  }
                >
                  {cryptoOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={option.id}
                        id={`crypto-${option.id}`}
                      />
                      <Label htmlFor={`crypto-${option.id}`}>
                        {option.text}
                      </Label>
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
  );
}
