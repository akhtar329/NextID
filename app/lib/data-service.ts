import { getCachedRedirect, setCachedRedirect } from "@/app/lib/cache";
import { AdmissionRepository } from "./repository";
import { CACHE_KEYS } from "./cache-keys";

export const DataService = {
  async getAdmissions() {
    const key = CACHE_KEYS.admissions;

    const cached = getCachedRedirect(key);
    if (cached) return cached;

    const data = await AdmissionRepository.getAll(20);

    setCachedRedirect(key, data);

    return data;
  },

  async getAdmission(slug: string) {
    const key = CACHE_KEYS.admission(slug);

    const cached = getCachedRedirect(key);
    if (cached) return cached;

    const data = await AdmissionRepository.getBySlug(slug);

    setCachedRedirect(key, data);

    return data;
  },
};