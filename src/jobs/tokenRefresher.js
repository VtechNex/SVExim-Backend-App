// jobs/tokenRefresher.js
const cron = require("node-cron");
const axios = require("axios");
const { getExpiringTokens, updateEbayTokens, getUserByEmail, getRefreshTokenExpiry } = require("../db");

async function refreshEbayTokens(email) {
    console.log("🔄 Checking for eBay tokens to refresh...");
    const expiringUsers = await getExpiringTokens();
    if (expiringUsers.length === 0) return;
    
    const user = await getUserByEmail(email);
    if (!user) {
        console.error(`❌ No user found with email: ${email}`);
        return;
    }

    // console.log(`🔄 Found ${expiringUsers.length} tokens to refresh`);

    // for (const user of expiringUsers) {
        try {
            const response = await axios.post(
                "https://api.ebay.com/identity/v1/oauth2/token",
                new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: user.refresh_token,
                    scope: process.env.EBAY_SCOPES,
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${Buffer.from(
                        `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
                        ).toString("base64")}`,
                    },
                }
            );

            const { access_token, expires_in } = response.data;
            await updateEbayTokens(user.email, access_token, expires_in);

            console.log(`✅ Token refreshed for ${user.email}`);
        } catch (err) {
            console.error(`❌ Failed to refresh token for ${user.email}:`, err.message);
        }
    // }
}

async function checkRefreshTokenExpiry() {
  console.log("⏰ Checking for users with expiring eBay refresh tokens...");

  try {
    const rows = await getRefreshTokenExpiry();

    if (rows.length === 0) return;

    for (const user of rows) {
      const daysLeft = Math.ceil(
        (new Date(user.refresh_token_expires) - new Date()) / (1000 * 60 * 60 * 24)
      );

      console.log(`⚠️ User ${user.email}'s eBay connection expires in ${daysLeft} days.`);
      await notifyUserToReconnect(user.email, daysLeft);
    }
  } catch (error) {
    console.error("❌ Error checking refresh token expiry:", error.message);
  }
}

// Dummy notification function
async function notifyUserToReconnect(email, daysLeft) {
  console.log(`📩 Sending alert to ${email}: Your eBay connection expires in ${daysLeft} days.`);

}

// Run every day at 9 AM
cron.schedule("0 9 * * *", checkRefreshTokenExpiry);

module.exports = { refreshEbayTokens };
