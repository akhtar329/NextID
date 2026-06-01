// /types/universities.types.ts
export interface University {
  id: number;
  name: string;
  slug: string;
  type: string;
  city: string;
  citySlug: string;
  established: string | null;
  website: string | null;
  description: string | null;
  programsCount: number;
  admissionsCount: number;
  isFeatured: boolean | null;
  ranking?: number;
}

export interface UniversityFilters {
  city?: string;
  type?: string;
  q?: string;
}

export interface UniversityStats {
  totalInstitutes: number;
  totalCities: number;
  institutesWithAdmissions: number;
}

export interface UniversityCardProps {
  university: University;
  featured?: boolean;
}

export interface UniversitySchemaProps {
  universities: University[];
}