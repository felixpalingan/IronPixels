import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, resendApiKey, mode } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required." },
        { status: 400 }
      );
    }

    if (mode === "direct" || resendApiKey) {
      const apiKey = resendApiKey || process.env.RESEND_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "Resend API Key (re_...) is required to test direct Resend delivery." },
          { status: 400 }
        );
      }

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "IronPixels Guild <onboarding@resend.dev>",
          to: [email],
          subject: "⚔️ [IRONPIXELS] Test Guild Email Deliverability",
          html: `
            <div style="background-color: #0a0a0a; color: #e5e2e1; font-family: monospace; padding: 24px; border: 2px solid #00ff41; max-width: 480px; margin: 0 auto;">
              <h1 style="color: #00ff41; font-size: 20px;">⚔️ IRONPIXELS RESEND TEST</h1>
              <p>Greetings Warrior!</p>
              <p>This is a live deliverability test sent via Resend API to <strong>${email}</strong>.</p>
              <div style="margin: 20px 0; background: #00ff41; color: #000; padding: 12px; font-weight: bold; text-align: center;">
                DELIVERABILITY STATUS: VERIFIED 100%
              </div>
              <p style="font-size: 11px; color: #888;">IronPixels Retro Fitness RPG © 2026</p>
            </div>
          `,
        }),
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: resendData.message || resendData.name || "Resend API returned error.",
            details: resendData,
          },
          { status: resendRes.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Email dispatched directly via Resend API! ID: ${resendData.id}`,
        details: resendData,
      });
    }

    const supabase = await createClient();
    const testPassword = `P@ssword_${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: testPassword,
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email,
        });

        if (resendError) {
          return NextResponse.json(
            { success: false, error: resendError.message },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Resend confirmation triggered for existing user ${email} via Supabase SMTP!`,
        });
      }

      return NextResponse.json(
        { success: false, error: signUpError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created test account and sent confirmation email to ${email} via Supabase SMTP!`,
      user_id: signUpData.user?.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to trigger email test." },
      { status: 500 }
    );
  }
}
