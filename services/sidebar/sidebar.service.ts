// services/sidebar/sidebar.service.ts
import { sidebarRepository, type SidebarPost } from "@/repositories/sidebar/sidebar.repository";
import { cache } from "react";

export interface SidebarData {
  trending: SidebarPost[];
  breaking: SidebarPost[];
  featured: SidebarPost[];
  quickAccess: Record<string, number>;
}

class SidebarService {
  
  // ✅ Level 1: React cache() - Per request deduplication
  // ✅ Level 2: Manual 24-hour cache (in-memory)
  
  private cacheData: SidebarData | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Main method - Get cached sidebar data
  getSidebarData = cache(async (): Promise<SidebarData> => {
    
    // Cache miss or expired - fetch fresh data
    console.log("🔄 [Cache MISS] Fetching fresh data from database...");
    
    const [trending, breaking, featured, quickAccess] = await Promise.all([
      sidebarRepository.getTrending(5),
      sidebarRepository.getBreaking(3),
      sidebarRepository.getFeatured(4),
      sidebarRepository.getTypeCounts(),
    ]);
    
    this.cacheData = { trending, breaking, featured, quickAccess };
    this.cacheTimestamp = Date.now();
    
    console.log("💾 [CACHE SET] Data cached for 24 hours");
    
    return this.cacheData;
  });

  // Force refresh cache (manually call when post updates)
  async refreshCache(): Promise<SidebarData> {
    console.log("🔄 [MANUAL REFRESH] Clearing cache...");
    this.cacheData = null;
    this.cacheTimestamp = null;
    return this.getSidebarData();
  }

  // Check if cache is still valid
  getCacheStatus(): { isValid: boolean; ageHours: number | null } {
    if (!this.cacheTimestamp) {
      return { isValid: false, ageHours: null };
    }
    const ageHours = (Date.now() - this.cacheTimestamp) / 1000 / 60 / 60;
    return {
      isValid: ageHours < 24,
      ageHours: Math.round(ageHours * 10) / 10,
    };
  }

  // Real-time data (no cache at all)
  async getSidebarDataRealTime(): Promise<SidebarData> {
    console.log("⚡ [REAL TIME] Fetching without cache...");
    const [trending, breaking, featured, quickAccess] = await Promise.all([
      sidebarRepository.getTrending(5),
      sidebarRepository.getBreaking(3),
      sidebarRepository.getFeatured(4),
      sidebarRepository.getTypeCounts(),
    ]);
    return { trending, breaking, featured, quickAccess };
  }
}

export const sidebarService = new SidebarService();