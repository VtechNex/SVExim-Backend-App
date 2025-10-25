// jobs/tokenRefresher.js
const cron = require("node-cron");
const axios = require("axios");
const { getExpiringTokens, updateEbayTokens } = require("../db");

async function refreshEbayTokens() {
    console.log("🔄 Checking for eBay tokens to refresh...");
    const expiringUsers = await getExpiringTokens();
    if (expiringUsers.length === 0) return;

    console.log(`🔄 Found ${expiringUsers.length} tokens to refresh`);

    for (const user of expiringUsers) {
        try {
            const response = await axios.post(
                "https://api.ebay.com/identity/v1/oauth2/token",
                new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: user.refresh_token,
                    scope: "https://api.ebay.com/oauth/api_scope",
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
    }
}

// Run every 10 minutes
cron.schedule("*/10 * * * *", refreshEbayTokens);
