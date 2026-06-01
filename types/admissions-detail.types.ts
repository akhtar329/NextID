// types/admissions-detail.types.ts
export interface ProgramDetail {
  id: number;
  name: string;
  slug: string;
  duration?: string | null;
  feeRange?: string | null;
  specificEligibility?: string | null;
}

export interface InstituteCity {
  id: number;
  name: string;
  slug: string;
  province?: string | null;
}

export interface InstituteDetail {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: InstituteCity | null;
}

export interface AdmissionDetail {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: 'Expected' | 'Open' | 'Closed';
  expectedOpenDate: Date | null;
  expectedCloseDate: Date | null;
  openDate: Date | null;
  closeDate: Date | null;
  meritInfo: string | null;
  note: string | null;
  applicationLink: string | null;
  officialLink: string | null;
  eligibility: string | null;
  howToApply: string | null;
  requiredDocuments: string | null;
  feeStructure: string | null;
  programCount: number;
  programs: ProgramDetail[];
  institute?: InstituteDetail | null;
}

export interface RelatedAdmission {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  instituteName: string;
}

export interface AdmissionDetailResponse {
  admission: AdmissionDetail | null;
  relatedAdmissions: RelatedAdmission[];
}