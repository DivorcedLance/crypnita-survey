export interface User {
  id?: string;
  nDoc: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  createdAt: Date;
}
  
  export interface Operator {
  id?: string;
  orbPointId: string | null;
  userDataId: string;
  userData: User;
}

export interface Sector {
  sectorName: string;
  sectorType: string;
}

export interface OrbPoint {
  id?: string;
  name: string;
  areaType: string;
  direction: string;
  region: string;
  sectors: Sector[];
  operatorId: string | null;
}

export interface SurveyOption {
  id: string;
  text: string;
}

export interface SurveyResponse {
  howDidYouHearAbout: string;
  visitingFrom: string;
  interestedCrypto: string[];
  contactNumber: string;
  operatorId: string;
  orbPointId: string;
  timestamp: Date;
}