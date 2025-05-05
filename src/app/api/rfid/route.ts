import { supabase } from "@/lib/supabase";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const uid = body.uid.toUpperCase();
  console.log(body);
  console.log(uid);

  if (!uid) {
    return NextResponse.json({ error: "UID is required" }, { status: 400 });
  }

  // Update scan time for all scanned UIDs (even unauthorized)
  await supabase
    .from("rfid_users")
    .update({ scanned_at: new Date().toISOString() })
    .eq("uid", uid);

  // Check authorization
  const { data, error } = await supabase
    .from("rfid_users")
    .select("*")
    .eq("uid", uid)
    .eq("authorized", true)
    .single();

  if (error || !data) {
    // Check if UID exists
    const { data: existingUser } = await supabase
      .from("rfid_users")
      .select("uid")
      .eq("uid", uid)
      .single();

    if (!existingUser) {
      await supabase.from("rfid_users").insert({
        uid,
        username: null,
        authorized: false,
        scanned_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ access: "denied" }, { status: 403 });
  }

  return NextResponse.json({ access: "granted", user: data.username });
}
