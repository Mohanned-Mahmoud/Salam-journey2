const { Client } = require('pg');
const client = new Client({connectionString: 'postgresql://salam_app:SalamApp%232026%21Db@ep-proud-rain-almuw0am-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'});
client.connect()
  .then(() => client.query("ALTER TABLE funnel_registrations ADD COLUMN IF NOT EXISTS booking_date text; ALTER TABLE funnel_registrations ADD COLUMN IF NOT EXISTS booking_slot text;"))
  .then(()=>console.log("Added columns to funnel_registrations"))
  .catch(console.error)
  .finally(()=>client.end());
