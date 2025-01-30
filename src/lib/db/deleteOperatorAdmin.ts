"use server";

import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConnection";
import { getAdminAuth } from "./firebaseAdmin";

export async function deleteOperatorServer(operatorId: string) {
  const adminAuth = await getAdminAuth();

  const operatorRef = doc(db, "Operator", operatorId);
  const operatorSnap = await getDoc(operatorRef);

  if (!operatorSnap.exists()) {
    throw new Error("Operator does not exist");
  }

  const orbPointId = operatorSnap.data().orbPointId;
  if (orbPointId) {
    await updateDoc(doc(db, "OrbPoint", orbPointId), { operatorId: null });
  }

  const userDataId = operatorSnap.data().userDataId;
  await adminAuth.deleteUser(userDataId);

  await Promise.all([
    deleteDoc(doc(db, "User", userDataId)),
    deleteDoc(doc(db, "Operator", operatorId)),
  ]);

  console.log("Operador eliminado completamente:", operatorId);
}
