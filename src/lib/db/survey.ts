import { SurveyResponse } from "@/types/index";

import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/db/firebaseConnection';

// Function to fetch and set surveyResponse data
export const getSurveyResponseById = async (surveyResponseId: string) => {
  try {
    // Reference to the document in the "SurveyResponse" collection
    const surveyResponseRef = doc(db, 'SurveyResponse', surveyResponseId);

    // Fetch the document
    const surveyResponseDoc = await getDoc(surveyResponseRef);

    if (surveyResponseDoc.exists()) {
      // Set the data to the state
      return surveyResponseDoc.data() as SurveyResponse
    } else {
      return null
    }
  } catch (error) {
    console.error('Error fetching surveyResponse data:', error);
  }
};

export const postSurveyResponse = async (surveyResponse: SurveyResponse) => {
  try {
    // Add a new document with a generated id
    await addDoc(collection(db, 'SurveyResponse'), surveyResponse);
  } catch (error) {
    console.error('Error adding surveyResponse data:', error);
  }
}