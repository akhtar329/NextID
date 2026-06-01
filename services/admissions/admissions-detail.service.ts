// services/admissions/admissions-detail.service.ts
import { getCachedAdmissionDetail } from "@/cache/admissions/admissions-detail.cache";
import { getAdmissionBySlug, getRelatedAdmissions } from "@/repositories/admissions/admissions-detail.repo";
import { AdmissionDetailResponse, RelatedAdmission } from "@/types/admissions-detail.types";

export async function getAdmissionDetailPage(slug: string, useCache: boolean = true): Promise<AdmissionDetailResponse> {
  if (useCache) {
    return getCachedAdmissionDetail(slug);
  }
  
  const admission = await getAdmissionBySlug(slug);
  
  // FIXED: Explicit type declaration
  let relatedAdmissions: RelatedAdmission[] = [];
  
  if (admission) {
    relatedAdmissions = await getRelatedAdmissions(admission.id, admission.institute?.id || 0);
  }
  
  return { admission, relatedAdmissions };
}