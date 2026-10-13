import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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

  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/api") ||
    path === "/sitemap.xml" ||
    path === "/robots.txt" ||
    path === "/manifest.webmanifest" ||
    path.endsWith(".xml") ||
    path.endsWith(".txt") ||
    (path.startsWith("/google") && path.endsWith(".html"))
  ) {
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthOnlyRoute = path === "/login" || path === "/register";
  const isPublicRoute = isAuthOnlyRoute || path === "/about";

  if (!user && !isPublicRoute) {
    if (path === "/") {
      return NextResponse.redirect(new URL("/about", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // Allow public pages like /about to be viewed by authenticated users
    if (path === "/about") {
      return response;
    }

    const cookieValue = request.cookies.get("ironpixels_onboarded")?.value;
    let isOnboarded = cookieValue === user.id;

    if (!isOnboarded) {
      const { data: profileList } = await supabase
        .from("profiles")
        .select("weight_kg, character_class")
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .limit(1);

      const profile = profileList && profileList.length > 0 ? profileList[0] : null;
      isOnboarded = Boolean(profile && profile.weight_kg && profile.character_class);

      if (isOnboarded) {
        response.cookies.set("ironpixels_onboarded", user.id, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
      } else if (cookieValue) {
        response.cookies.delete("ironpixels_onboarded");
      }
    }

    if (!isOnboarded && path !== "/onboarding") {
      const redirect = NextResponse.redirect(new URL("/onboarding", request.url));
      redirect.cookies.delete("ironpixels_onboarded");
      return redirect;
    }

    if (isOnboarded && (isAuthOnlyRoute || path === "/onboarding")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|assets|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt|ico)$).*)",
  ],
};
