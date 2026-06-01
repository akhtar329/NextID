// types/admissions.types.ts
export interface AdmissionFilters {
  city?: string;
  level?: string;
  q?: string;
  page: number;
  showClosed: boolean;
}

export interface AdmissionItem {
  id: number;
  name: string;
  slug: string;
  instituteName: string;
  instituteLogo: string | null;
  cityName: string;
  status: string;
  openDate: string | null;
  closeDate: string | null;
  programs: { id: number; name: string }[];
}

export interface AdmissionsResponse {
  admissions: AdmissionItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface AdmissionStats {
  total: number;
  closingSoon: number;
  universities: number;
  cities: number;
  programsByLevel: Record<string, number>;
}