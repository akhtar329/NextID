// services/sidebar/sidebar.service.ts

import { cache } from "react";
import { sidebarRepository, type SidebarPost } from "@/repositories/sidebar/sidebar.repository";

export interface SidebarData {
  trending: SidebarPost[];
  breaking: SidebarPost[];
  featured: SidebarPost[];
  quickAccess: Record<string, number>;
}

type SidebarRepositoryMethods = {
  getTrending(limit: number): Promise<SidebarPost[]>;
  getBreaking(limit: number): Promise<SidebarPost[]>;
  getFeatured(limit: number): Promise<SidebarPost[]>;
  getTypeCounts(): Promise<Record<string, number>>;
};

class SidebarService {
  private repo = sidebarRepository as unknown as SidebarRepositoryMethods;

  // ✅ LIMIT: 10 (5 ki jagah) - Cache key consistent with preCacheAllTypes(10)
  getSidebarData = cache(async (): Promise<SidebarData> => {

    const [trending, breaking, featured, quickAccess] = await Promise.all([
      this.repo.getTrending(10),   // ✅ 5 → 10
      this.repo.getBreaking(10),   // ✅ 3 → 10
      this.repo.getFeatured(10),   // ✅ 4 → 10
      this.repo.getTypeCounts(),
    ]);

    return {
      trending,
      breaking,
      featured,
      quickAccess,
    };
  });

  // ⚠️ If you REALLY need refresh, do NOT fake cache
  async refreshCache(): Promise<SidebarData> {
    return this.getSidebarData();
  }

  // ⚠️ This is fine but mostly useless in serverless
  getCacheStatus() {
    return {
      isValid: false,
      note: "React cache is request-level only. No persistent cache exists here.",
    };
  }

  async getSidebarDataRealTime(): Promise<SidebarData> {
    return this.getSidebarData();
  }
}

export const sidebarService = new SidebarService();