// Send DHT data
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://wbfyqtigldzdczpfyyxb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnlxdGlnbGR6ZGN6cGZ5eXhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMyMzQwNywiZXhwIjoyMDYxODk5NDA3fQ.sa9z5pFOE620LiL3Jphjxfme5oanx_Svjjh7DTEIUws'
);

async function sendMockDHT() {
  const { data, error } = await supabase
    .from('dht_logs')
    .insert([{ temperature: 24.5, humidity: 55.1 }]);

  console.log('Sent DHT:', data, error);
}

sendMockDHT();
