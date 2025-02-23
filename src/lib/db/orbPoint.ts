import { OrbPoint } from "@/types/index";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/db/firebaseConnection";

// Function to fetch and set orbPoint data
export const getOrbPointById = async (orbPointId: string) => {
  try {
    // Reference to the document in the "OrbPoint" collection
    const orbPointRef = doc(db, "OrbPoint", orbPointId);

    // Fetch the document
    const orbPointDoc = await getDoc(orbPointRef);

    if (orbPointDoc.exists()) {
      return { id: orbPointDoc.id, ...orbPointDoc.data() } as OrbPoint;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching orbPoint data:", error);
  }
};

export const getOrbPoints = async () => {
  try {
    const orbPoints: OrbPoint[] = [];
    const orbPointsSnap = await getDocs(collection(db, "OrbPoint"));

    orbPointsSnap.forEach((doc) => {
      orbPoints.push({ id: doc.id, ...doc.data() } as OrbPoint);
    });

    return orbPoints;
  } catch (error) {
    console.error("Error fetching orbPoints:", error);
  }
};

export const deleteOrbPoint = async (orbPointId: string) => {
  try {
    const orbPointRef = doc(db, "OrbPoint", orbPointId);

    const orbPointDoc = await getDoc(orbPointRef);
    if (!orbPointDoc.exists()) {
      throw new Error("Orb point does not exist");
    }
    if (orbPointDoc.data().operatorId) {
      await updateDoc(doc(db, "Operator", orbPointDoc.data().operatorId), {
        orbPointId: null,
      });
    }
    await deleteDoc(orbPointRef);
  } catch (error) {
    console.error("Error deleting orbPoint:", error);
  }
};
