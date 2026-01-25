const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkColumns() {
    console.log("Checking 'material_requests' table columns...");

    // Try to insert a dummy row to see schema errors, OR select
    // Selecting * might not return the column if it's null and not in the types? 
    // No, JS client returns what's there.

    const { data, error } = await supabase
        .from('material_requests')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error connecting to DB:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("Found row. Available columns:", Object.keys(data[0]));
        if (Object.keys(data[0]).includes('engineer_note')) {
            console.log("✅ SUCCESS: 'engineer_note' column EXISTS.");
        } else {
            console.log("❌ FAILURE: 'engineer_note' column is MISSING.");
        }
    } else {
        console.log("Table is empty. Cannot verify columns via SELECT. Trying to Inspect via RPC if possible or assume missing if error persists.");
    }
}

checkColumns();
