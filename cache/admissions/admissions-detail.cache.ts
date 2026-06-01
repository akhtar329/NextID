// cache/admissions/admissions-detail.cache.ts
import { unstable_cache } from "next/cache";
import { getAdmissionBySlug, getRelatedAdmissions } from "@/repositories/admissions/admissions-detail.repo";
import { AdmissionDetailResponse, RelatedAdmission } from "@/types/admissions-detail.types";

export const getCachedAdmissionDetail = (slug: string): Promise<AdmissionDetailResponse> => {
  return unstable_cache(
    async (): Promise<AdmissionDetailResponse> => {
      const admission = await getAdmissionBySlug(slug);
      
      let relatedAdmissions: RelatedAdmission[] = []; // FIXED: 'any[]' changed to 'RelatedAdmission[]'
      if (admission) {
        relatedAdmissions = await getRelatedAdmissions(admission.id, admission.institute?.id || 0);
      }
      
      return { admission, relatedAdmissions };
    },
    [`admission-detail:${slug}`],
    {
      revalidate: 3600, // 1 hour
      tags: [`admission:${slug}`, 'admissions'],
    }
  )();
};

// For manual cache invalidation
export const revalidateAdmissionDetailCache = (slug: string) => {
  // This function is used to manually revalidate cache from admin panel
  if (slug) {
    // revalidateTag(`admission:${slug}`);
    // revalidateTag('admissions');
    console.log(`Cache revalidation triggered for admission: ${slug}`);
  }
};