import axios from 'axios';
import { stringify } from 'qs';
import dotenv from 'dotenv';
dotenv.config();

const appId = process.env.EBAY_APP_ID_MARINE;
const clientSecret = process.env.EBAY_CLIENT_SECRET_MARINE;


async function generateToken() {
    const tokenUrl = process.env.TOKEN_GENERATOR_URL;
    if (!tokenUrl) {
        return -1;
    }
    const credentials = Buffer.from(`${appId}:${clientSecret}`).toString("base64");

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
    };

    const data = stringify({
        grant_type: "client_credentials",
        scope: process.env.EBAY_SCOPE_URL_MARINE // modify scope if needed
    });

    const response = await axios.post(tokenUrl, data, {headers});
    if (response.status !== 200) {
        return -2;
    }
    console.log("Token generated: ", response.data);
    return response.data;
}

const EBAY = {
    generateToken
};

export default EBAY;
