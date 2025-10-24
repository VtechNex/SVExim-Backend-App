import axios from 'axios'
import dotenv from 'dotenv';
import qs from "qs";
dotenv.config();

/**
 * Authorizes eBay API access and returns the authorization URL.
 * @returns {Promise<string>} The authorization URL for eBay.
 * @throws {Error} If the eBay Client ID or Secret is not set in environment variables.
 */
async function authorizeEbay() {
  const appId = process.env.EBAY_APP_ID_MARINE;
  const clientSecret = process.env.EBAY_CLIENT_SECRET_MARINE;

  if (!appId || !clientSecret) {
    throw new Error("Ebay Client ID and Secret must be set in environment variables.");
  }

  const TOKEN_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

  const credentials = Buffer.from(`${appId}:${clientSecret}`).toString("base64");
  console.log("Encoded Credentials:", credentials);

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization": `Basic ${credentials}`,
  };

  const data = qs.stringify({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope" // modify scope if needed
  });

  try {
    const response = await axios.post(
      TOKEN_URL,
      data,
      { headers }
    );

    console.log("Access Token:", response.data.access_token);
    return response.data;
  } catch (error) {
    console.error("Error generating eBay token:", error.response?.data || error.message);
  }

}

authorizeEbay()  .then(url => {
    console.log("eBay Authorization URL:", url);
  })
  .catch(error => {
    console.error("Error authorizing eBay:", error);
  });
