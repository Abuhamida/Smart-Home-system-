'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ControlPanel() {
  const [faceResult, setFaceResult] = useState('');

  const handleUnlock = async () => {
    await supabase.from('control').update({ unlock_request: true }).eq('id', 1); // assuming control.id = 1
  };

  const handleFaceDetection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('http://localhost:5000/detect-face', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    setFaceResult(data.result);

    if (data.result === 'yes') handleUnlock();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Control Panel</h1>

      <button className="btn" onClick={handleUnlock}>Unlock Door</button>

      <div className="mt-4">
        <input type="file" accept="image/*" onChange={handleFaceDetection} />
        {faceResult && <p>Face Detection Result: {faceResult}</p>}
      </div>
    </div>
  );
}