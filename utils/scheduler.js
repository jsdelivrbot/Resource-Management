const { checkForExpiredVouchers } = require('../middleware/voucher');

const CronJob = require("cron").CronJob;

// This Job will run on every day 12:05 AM Dubai timezone
const job = new CronJob(
  "00 05 00 * * *",
  () => {
    console.log("CRON Job Fired at :: ", new Date());
    console.log(job.running);
    checkForExpiredVouchers();
  },
  () => {
    console.log("CRON Job Stop at :: ", new Date());
    console.log(job.running);
    checkForExpiredVouchers();
    job.start();
  },
  true,
  "Asia/Dubai"
);

module.exports = { job };
