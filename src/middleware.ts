import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gwyqrhaipihirpeknyey.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_AyF4vSPu2pq_FoYXYzrokQ_0Fe1co9D",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api")) {
    return response;
  }

  const isPublicRoute = path === "/login" || path === "/register";

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("Users")
      .select("weight_kg, character_class")
      .eq("user_id", user.id)
      .single();

    const isOnboarded = profile && profile.weight_kg && profile.character_class;

    if (!isOnboarded && path !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (isOnboarded && (isPublicRoute || path === "/onboarding")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
