"use client";

import RealtimeRFIDListener from "../component/useraccess";
import RealtimeMotionListener from "../component/motion";
import RealtimeTemperatureListener from "../component/temp";
import WebcamCapture from "../component/facedetection";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Face Detection Card */}
          <div className="bg-white shadow-md rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Face Detection
            </h2>
            <WebcamCapture />
          </div>
          {/* Temperature Card */}
          <div className="bg-white shadow-md rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Temperature
            </h2>
            <RealtimeTemperatureListener />
          </div>

          {/* Motion Card */}
          <div className="bg-white shadow-md rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Motion</h2>
            <RealtimeMotionListener />
          </div>

          {/* User Access Card */}
          <div className="bg-white shadow-md rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              User Access (RFID)
            </h2>
            <RealtimeRFIDListener />
          </div>
        </div>
      </div>
    </div>
  );
}
