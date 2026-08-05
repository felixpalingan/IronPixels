import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wrvazjrpvwaippcsqxvg.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_JcebXyaBailBLK8l1o44wg_wXpN6bVr",
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
    let isOnboarded = request.cookies.get("ironpixels_onboarded")?.value === "true";

    if (!isOnboarded) {
      const { data: profileList } = await supabase
        .from("profiles")
        .select("weight_kg, character_class")
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .limit(1);

      const profile = profileList && profileList.length > 0 ? profileList[0] : null;
      isOnboarded = Boolean(profile && profile.weight_kg && profile.character_class);
    }

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
