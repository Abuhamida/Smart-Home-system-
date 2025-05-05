"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function WebcamCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authorizedFaces] = useState(["Shaheen"]);
  const [commandStatus, setCommandStatus] = useState<string>("");

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('hardware_commands_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hardware_commands',
          filter: 'device_id=eq.esp32_device'
        },
        (payload) => {
          console.log('Change received!', payload);
          if (payload.eventType === 'INSERT') {
            setCommandStatus(`Command sent: ${payload.new.command} (pending)`);
          } else if (payload.eventType === 'UPDATE') {
            setCommandStatus(`Command updated: ${payload.new.command} (${payload.new.status})`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    const getWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Webcam access denied", error);
        setResponse("Webcam access denied");
      }
    };
    getWebcam();
  }, []);

  const captureAndSend = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    setIsLoading(true);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, 224, 224);
    const imageData = canvasRef.current.toDataURL("image/jpeg");

    try {
      const res = await fetch("http://127.0.0.1:5000/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await res.json();
      const detectedClass = result.class?.split(" ")[1] || "Unknown";
      setResponse(result.message || `Detected: ${detectedClass}`);

      if (authorizedFaces.includes(detectedClass)) {
        const { data, error } = await supabase
          .from('hardware_commands')
          .insert([{
            command: 'activate_led',
            led_color: 'green',
            status: 'pending',
            device_id: 'esp32_device',
            expires_at: new Date(Date.now() + 30000).toISOString()
          }])
          .select();

        if (error) {
          console.error('Supabase error:', error);
          setResponse("Failed to send command to hardware");
        } else {
          setResponse(`✅ Access granted to ${detectedClass}`);
        }
      } else {
        setResponse(`❌ Unauthorized: ${detectedClass}`);
      }
    } catch (err) {
      console.error(err);
      setResponse("Failed to send image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col items-center space-y-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={224}
        height={224}
        className="rounded-md border border-gray-300"
      />
      <canvas
        ref={canvasRef}
        width={224}
        height={224}
        style={{ display: "none" }}
      />

      <button
        onClick={captureAndSend}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white transition-all duration-200 ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Processing..." : "Capture and Send"}
      </button>

      {response && (
        <div
          className={`text-sm px-4 py-2 rounded-md ${
            response.includes("✅")
              ? "bg-green-100 text-green-700"
              : response.includes("❌")
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {response}
        </div>
      )}

      {commandStatus && (
        <div className="text-sm px-4 py-2 rounded-md bg-gray-100 text-gray-700">
          {commandStatus}
        </div>
      )}
    </div>
  );
}