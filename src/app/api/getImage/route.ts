import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminClient } from "@/types/types";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const supabaseAdmin = supabaseAdminClient();
    const { data, error } = await supabaseAdmin.storage
      .from("quiz_images")
      .download(path);

    if (error) throw error;

    // Create a new response with the file data
    const response = new NextResponse(data);

    // Set appropriate headers
    response.headers.set("Content-Type", data.type);
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );

    return response;
  } catch (error) {
    console.error("Error downloading image:", error);
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 500 }
    );
  }
}
