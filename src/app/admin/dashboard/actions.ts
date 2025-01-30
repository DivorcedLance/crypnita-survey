"use server";

import { getAdminAuth } from "@/lib/db/firebaseAdmin";
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/db/firebaseConnection";

export async function createSupervisorAction({
  email,
  password,
  firstname,
  lastname,
  nDoc,
}: {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  nDoc: string;
}) {
  const adminAuth = await getAdminAuth();
  const userRecord = await adminAuth.createUser({
    email,
    password,
  });

  const uid = userRecord.uid;

  await setDoc(doc(db, "User", uid), {
    firstname,
    lastname,
    nDoc,
    email,
    role: "operator",
    createdAt: new Date().toISOString(),
  });

  await addDoc(collection(db, "Operator"), {
    orbPointId: null,
    userDataId: uid,
  });

  return uid;
}
