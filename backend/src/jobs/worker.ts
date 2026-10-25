import { configuration } from '../config/env.ts';
import { openStore } from '../config/database.ts';
import { syncDue, waitForJobs } from './dailyStandup.job.ts';
const config = configuration(),
  db = openStore(config);
try {
  console.log(await syncDue(db, config));
  await waitForJobs();
} finally {
  db.close();
}
