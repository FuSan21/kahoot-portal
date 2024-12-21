import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/types/types";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const { data } = supabase.storage.from("quiz_images").getPublicUrl(path);

    const imageResponse = await fetch(data.publicUrl);
    const imageData = await imageResponse.arrayBuffer();

    return new NextResponse(imageData);
  } catch (error) {
    console.error("Error getting image URL:", error);
    return NextResponse.json({ error: "Failed to get image" }, { status: 500 });
  }
}
