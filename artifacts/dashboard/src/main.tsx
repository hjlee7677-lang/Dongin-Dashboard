import { createClient } from '@supabase/supabase-js';
import { createRoot } from "react-dom/client";

const supabaseUrl = 'https://svjrurpxeohdgibdiwx.supabase.co';
const supabaseKey = 'sb_publishable_IRLATvdi4ZTjTjZnTGFtIw_9IKm2qfu';

export const supabase = createClient(supabaseUrl, supabaseKey);

import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
``
