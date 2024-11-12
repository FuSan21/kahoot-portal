import { NextResponse } from "next/server";
import { BASE_URL } from "@/constants";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectTo = requestUrl.searchParams.get("redirect");

  // Redirect to the original destination or dashboard
  return NextResponse.redirect(
    redirectTo ? `${BASE_URL}/${redirectTo}` : `${BASE_URL}/host/dashboard`
  );
}
