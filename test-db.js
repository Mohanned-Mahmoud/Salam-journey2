const { Client } = require('pg');
const c = new Client('postgresql://salam_app:SalamApp%232026%21Db@ep-proud-rain-almuw0am-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require');
c.connect()
  .then(()=>c.query('SELECT id, "title_ar", price, category FROM courses'))
  .then(r=>{console.log(r.rows);c.end()})
  .catch(console.error);
