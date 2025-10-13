import dotenv from "dotenv";
dotenv.config();

export const accounts = [
  {
    id: 1,
    email: process.env.AUDIOMACK_ACCOUNT_1_EMAIL,
    password: process.env.AUDIOMACK_ACCOUNT_1_PASSWORD
  },
  {
    id: 2,
    email: process.env.AUDIOMACK_ACCOUNT_2_EMAIL,
    password: process.env.AUDIOMACK_ACCOUNT_2_PASSWORD
  }
  // ... up to 10 accounts
];

export const uploadThresholdFollowers = parseInt(process.env.AUDIOMACK_FOLLOWER_THRESHOLD) || 25;
export const batchFrequencyCron = process.env.AUDIOMACK_BATCH_FREQ_CRON || "0 */6 * * *";
