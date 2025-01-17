import { User } from "@/types/index";

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/db/firebaseConnection';

// Function to fetch and set user data
export const getUserById = async (userId: string) => {
  try {
    // Reference to the document in the "User" collection
    const userRef = doc(db, 'User', userId);

    // Fetch the document
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return {id: userDoc.id, ...userDoc.data()} as User
    } else {
      return null
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};