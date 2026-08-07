// services/sidebar/sidebar.service.ts

import { sidebarRepository, type SidebarPost } from "@/repositories/sidebar/sidebar.repository";
import { cacheTag, cacheLife } from "next/cache";

export interface SidebarData {
  trending: SidebarPost[];
  breaking: SidebarPost[];
  featured: SidebarPost[];
  quickAccess: Record<string, number>;
}

async function getSidebarData(): Promise<SidebarData> {
  "use cache";
  cacheTag("sidebar-data", "sidebar-widgets", "posts");
  cacheLife("days");

  const [trending, breaking, featured, quickAccess] = await Promise.all([
    sidebarRepository.getTrending(10),
    sidebarRepository.getBreaking(10),
    sidebarRepository.getFeatured(10),
    sidebarRepository.getTypeCounts(),
  ]);

  return {
    trending,
    breaking,
    featured,
    quickAccess,
  };
}

export const sidebarService = { getSidebarData };
