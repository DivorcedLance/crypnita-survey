import { Operator } from "@/types/index";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/db/firebaseConnection";
import { getUserById } from "@/lib/db/user";
import { deleteOperatorServer } from "./deleteOperatorAdmin";

// Function to fetch and set operator data
export const getOperatorById = async (operatorId: string) => {
  try {
    // Reference to the document in the "Operator" collection
    const operatorRef = doc(db, "Operator", operatorId);

    // Fetch the document
    const operatorDoc = await getDoc(operatorRef);

    if (operatorDoc.exists()) {
      const userData = await getUserById(operatorDoc.data().userDataId);
      return {
        id: operatorDoc.id,
        userData: userData,
        ...operatorDoc.data(),
      } as Operator;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching operator data:", error);
  }
};

export const getOperators = async () => {
  try {
    const operators: Operator[] = [];
    const [operatorsSnap, userOpSnap] = await Promise.all([
      getDocs(collection(db, "Operator")),
      getDocs(query(collection(db, "User"), where("role", "==", "operator"))),
    ]);

    operatorsSnap.forEach(async (doc) => {
      const userData = userOpSnap.docs.find(
        (user) => user.id === doc.data().userDataId
      );
      if (userData) {
        operators.push({
          id: doc.id,
          userData: userData.data(),
          ...doc.data(),
        } as Operator);
      }
    });

    return operators;
  } catch (error) {
    console.error("Error fetching operators:", error);
  }
};

export const fetchPromotersWithoutOrbPoint = async () => {
  try {
    // Query the User collection for promoters
    const usersQuery = query(
      collection(db, "User"),
      where("role", "==", "promoter")
    );
    const usersSnap = await getDocs(usersQuery);

    // Get Operator documents and filter those without an OrbPoint
    const promoters = [];
    for (const userDoc of usersSnap.docs) {
      const operatorQuery = query(
        collection(db, "Operator"),
        where("userDataId", "==", userDoc.id),
        where("orbPointId", "==", null)
      );
      const operatorSnap = await getDocs(operatorQuery);

      if (!operatorSnap.empty) {
        promoters.push({
          id: operatorSnap.docs[0].id,
          userData: userDoc.data(),
          ...operatorSnap.docs[0].data(),
        });
      }
    }

    return promoters;
  } catch (error) {
    console.error("Error fetching promoters:", error);
    throw error;
  }
};

export const asignOperatorToOrbPoint = async (
  operatorId: string,
  orbPointId: string
) => {
  try {
    const operatorDoc = await getDoc(doc(db, "Operator", operatorId));
    const orbPointIdDoc = await getDoc(doc(db, "OrbPoint", orbPointId));

    if (!operatorDoc.exists()) {
      throw new Error("Operator does not exist");
    }

    if (!orbPointIdDoc.exists()) {
      throw new Error("Orb point does not exist");
    }

    const oldOperatorId = orbPointIdDoc.data().operatorId;
    if (oldOperatorId) {
      await updateDoc(doc(db, "Operator", oldOperatorId), { orbPointId: null });
    }
    if (oldOperatorId === operatorId) {
      throw new Error("Operator is already assigned to this orb point");
    }

    const oldOrbPointId = operatorDoc.data().orbPointId;
    if (oldOrbPointId) {
      await updateDoc(doc(db, "OrbPoint", oldOrbPointId), { operatorId: null });
    }
    if (oldOrbPointId === orbPointId) {
      throw new Error("Orb point is already assigned to this operator");
    }

    await Promise.all([
      updateDoc(doc(db, "Operator", operatorId), { orbPointId: orbPointId }),
      updateDoc(doc(db, "OrbPoint", orbPointId), { operatorId: operatorId }),
    ]);
  } catch (error) {
    console.error("Error asigning operator to orb point:", error);
  }
};

export const deleteOperator = async (operatorId: string) => {
  const operatorSnap = await getDoc(doc(db, "Operator", operatorId));
  if (!operatorSnap.exists()) {
    throw new Error("Operator does not exist");
  }
  const orbPointId = operatorSnap.data().orbPointId;
  if (orbPointId) {
    await updateDoc(doc(db, "OrbPoint", orbPointId), { operatorId: null });
  }

  await deleteOperatorServer(operatorId);
};

export async function unassignOperatorFromOrbPoint(operatorId: string) {
  try {
    const operatorRef = doc(db, "Operator", operatorId);
    const operatorSnap = await getDoc(operatorRef);

    if (!operatorSnap.exists()) {
      throw new Error("Operator does not exist");
    }

    await updateDoc(operatorRef, { orbPointId: null });
  } catch (error) {
    console.error("Error unassigning operator:", error);
    throw error;
  }
}

export const assignPromoterToOrbPoint = async (
  promoterId: string,
  orbPointId: string
) => {
  try {
    const promoterRef = doc(db, "Operator", promoterId);
    const orbPointRef = doc(db, "OrbPoint", orbPointId);

    const promoterSnap = await getDoc(promoterRef);
    const orbPointSnap = await getDoc(orbPointRef);

    if (!promoterSnap.exists()) {
      throw new Error("Promoter does not exist");
    }
    if (!orbPointSnap.exists()) {
      throw new Error("OrbPoint does not exist");
    }

    const oldOrbPointId = promoterSnap.data().orbPointId;
    if (oldOrbPointId === orbPointId) {
      throw new Error("Promoter is already assigned to this OrbPoint");
    }

    await updateDoc(promoterRef, { orbPointId });
  } catch (error) {
    console.error("Error assigning promoter to orb point:", error);
  }
};
