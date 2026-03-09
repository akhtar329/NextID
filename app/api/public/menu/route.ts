// app/api/public/menu/route.ts

import { NextResponse } from "next/server";
import { getMenuData } from "@/app/lib/menu-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId') || 'institutes';
    const category = searchParams.get('category');
    
    // Convert null to undefined
    const categorySlug = category === null ? undefined : category;

    console.log("Menu API called with:", { menuId, category: categorySlug });
    
    const data = await getMenuData(menuId, categorySlug);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Menu API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu data" },
      { status: 500 }
    );
  }
}