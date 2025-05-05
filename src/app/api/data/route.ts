import { supabase } from "@/lib/supabase";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { temperature, motion } = body;

    if (typeof temperature === "number") {
      // Get latest temperature log
      const { data: latestTemp, error: getTempError } = await supabase
        .from("temp_logs")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (getTempError) throw getTempError;

      // Update it
      const { error: tempUpdateError } = await supabase
        .from("temp_logs")
        .update({ temperature, created_at: new Date().toISOString() })
        .eq("id", latestTemp.id);

      if (tempUpdateError) throw tempUpdateError;
    }

    if (typeof motion === "boolean") {
      // Get latest motion log
      const { data: latestMotion, error: getMotionError } = await supabase
        .from("pir_logs")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (getMotionError) throw getMotionError;

      // Update it
      const { error: motionUpdateError } = await supabase
        .from("pir_logs")
        .update({ motion, created_at: new Date().toISOString() })
        .eq("id", latestMotion.id);

      if (motionUpdateError) throw motionUpdateError;
    }

    return NextResponse.json({ status: "updated" }, { status: 200 });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
