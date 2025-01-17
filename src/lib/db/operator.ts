import { Operator } from "@/types/index";

import { doc, getDoc, updateDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/db/firebaseConnection';
import { getUserById } from "@/lib/db/user";

// Function to fetch and set operator data
export const getOperatorById = async (operatorId: string) => {
  try {
    // Reference to the document in the "Operator" collection
    const operatorRef = doc(db, 'Operator', operatorId);

    // Fetch the document
    const operatorDoc = await getDoc(operatorRef);

    if (operatorDoc.exists()) {
      const userData = await getUserById(operatorDoc.data().userDataId);
      return {id: operatorDoc.id, userData: userData, ...operatorDoc.data()} as Operator
    } else {
      return null
    }
  } catch (error) {
    console.error('Error fetching operator data:', error);
  }
};

export const getOperators = async () => {
  try {
    const operators: Operator[] = [];
    const [operatorsSnap, userOpSnap] = await Promise.all([
      getDocs(collection(db, "Operator")),
      getDocs(query(collection(db, "User"), where("role", "==", "operator"))),
    ])
    
    operatorsSnap.forEach(async (doc) => {
      const userData = userOpSnap.docs.find((user) => user.id === doc.data().userDataId);
      if (userData) {
        operators.push({id: doc.id, userData: userData.data(), ...doc.data()} as Operator);
      }
    });

    return operators;
  } catch (error) {
    console.error('Error fetching operators:', error);
  }
}

export const asignOperatorToOrbPoint = async (operatorId: string, orbPointId: string) => {
  try {
    const operatorDoc = await getDoc(doc(db, 'Operator', operatorId))
    const orbPointIdDoc = await getDoc(doc(db, 'OrbPoint', orbPointId))

    if (!operatorDoc.exists()) {
      throw new Error('Operator does not exist');
    }

    if (!orbPointIdDoc.exists()) {
      throw new Error('Orb point does not exist');
    }

    const oldOperatorId = orbPointIdDoc.data().operatorId;
    if (oldOperatorId) {
      await updateDoc(doc(db, 'Operator', oldOperatorId), {orbPointId: null});
    }
    if (oldOperatorId === operatorId) {
      throw new Error('Operator is already assigned to this orb point');
    }

    const oldOrbPointId = operatorDoc.data().orbPointId;
    if (oldOrbPointId) {
      await updateDoc(doc(db, 'OrbPoint', oldOrbPointId), {operatorId: null});
    }
    if (oldOrbPointId === orbPointId) {
      throw new Error('Orb point is already assigned to this operator');
    }

    await updateDoc(doc(db, 'Operator', operatorId), {orbPointId: orbPointId});
    await updateDoc(doc(db, 'OrbPoint', orbPointId), {operatorId: operatorId});

  } catch (error) {
    console.error('Error asigning operator to orb point:', error);
  }
}

export const deleteOperator = async (operatorId: string) => {
  try {
    const operatorDoc = await getDoc(doc(db, 'Operator', operatorId));
    if (!operatorDoc.exists()) {
      throw new Error('Operator does not exist');
    }

    const orbPointId = operatorDoc.data().orbPointId;
    if (orbPointId) {
      await updateDoc(doc(db, 'OrbPoint', orbPointId), {operatorId: null});
    }

    await deleteDoc(doc(db, 'Operator', operatorId));
  } catch (error) {
    console.error('Error deleting operator:', error);
  }
}