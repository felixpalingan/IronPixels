import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          hint: "Make sure custom SMTP is enabled in Supabase Dashboard with Resend API credentials.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test confirmation email sent to ${email} via Resend SMTP!`,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to trigger test email." },
      { status: 500 }
    );
  }
}
