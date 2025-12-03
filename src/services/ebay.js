const axios = require('axios');
const dotenv = require('dotenv');
const { saveEbayToken, addProductsToDatabase, countProducts } = require('../db');
dotenv.config();
const fs = require("fs");
const zlib = require("zlib");
const readline = require("readline");
const xml2js = require("xml2js");
const ExcelJS = require("exceljs");

async function oAuthToken(email, code, res) {
    try {
        const response = await axios.post(
            "https://api.ebay.com/identity/v1/oauth2/token",
            new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: process.env.EBAY_RUNAME,
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
        
        console.log("✅ Token Response:", response.data);
        const result = await saveEbayToken(email, response.data);
        console.log("Token saved for user:", result);

        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error("❌ Token exchange error:", error.response?.data || error.message);
        return res.status(500).json({
        success: false,
        error: error.response?.data || error.message,
        });
    }
}

async function getProducts(user, page, totalPages) {
  const response = await getMyeBaySelling(user.access_token, page, totalPages);
  // console.log('eBaySelling response active list', response)
  console.log('Product sync response', response)
  return response;
}

async function getMyeBaySelling(accessToken, pageNumber, totalPages = 1) {
  const EBAY_ENDPOINT = "https://api.ebay.com/ws/api.dll";

  let allItems = [];

  console.log("📦 Starting sync...");

  console.log(`📄 Fetching page ${pageNumber}...`);

  const xmlRequest = `
    <?xml version="1.0" encoding="utf-8"?>
    <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${accessToken}</eBayAuthToken>
      </RequesterCredentials>
      <ActiveList>
        <Include>true</Include>
        <Pagination>
          <EntriesPerPage>200</EntriesPerPage>
          <PageNumber>${pageNumber}</PageNumber>
        </Pagination>
      </ActiveList>
    </GetMyeBaySellingRequest>
  `;

  try {
    const response = await axios.post(EBAY_ENDPOINT, xmlRequest, {
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-CALL-NAME": "GetMyeBaySelling",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1119",
      },
    });
    // console.log('Response on EBAY ENDPOINT', response);

    const parsed = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
      mergeAttrs: true,
    });

    const activeList = parsed?.GetMyeBaySellingResponse?.ActiveList;

    if (!activeList || !activeList.ItemArray) return { message: "No active listings found." };

    const items = activeList.ItemArray.Item;
    console.log(`Got items list with ${items.length}`)

    let products = [];

    if (Array.isArray(items)) {
      products = items;
    } else if (items) {
      products = [items];
    }

    // Convert raw eBay item → our DB product format
    const formattedProducts = products.map((item) => {
      return {
        sku: item.SKU || item.ItemID,

        product: {
          title: item.Title || "",
          description: item.Description || "", // not in response, so fallback
          imageUrls: item.PictureDetails?.PictureURL 
                    ? Array.isArray(item.PictureDetails.PictureURL)
                        ? item.PictureDetails.PictureURL
                        : [item.PictureDetails.PictureURL]
                    : item.PictureDetails?.GalleryURL 
                        ? [item.PictureDetails.GalleryURL]
                        : [],
        },

        price: item.SellingStatus?.CurrentPrice?._ 
              ? parseFloat(item.SellingStatus.CurrentPrice._)
              : 0,

        currency: item.SellingStatus?.CurrentPrice?.currencyID || "USD",

        condition: item.ConditionDisplayName || 
                  item.ConditionID ||
                  "Unknown",

        availability: {
          shipToLocationAvailability: {
            quantity: parseInt(item.QuantityAvailable || item.Quantity || 0),
          }
        }
      };
    });

    const uniqueMap = new Map();

    formattedProducts.forEach(p => {
      const sku = p.sku || "";
      if (!uniqueMap.has(sku)) {
        uniqueMap.set(sku, p);
      }
    });

    const uniqueProducts = Array.from(uniqueMap.values());

    console.log(`Adding products [${uniqueProducts.length}] to database`)

    // 🟢 Save this batch to database
    await addProductsToDatabase(uniqueProducts);

    // Also add to final list if needed
    allItems.push(...uniqueProducts);

    totalPages = parseInt(activeList?.PaginationResult?.TotalNumberOfPages || "1");
  } catch (err) {
    console.error("❌ Trading API error:", err.response?.data || err.message);
    return { error: err.response?.data || err.message };
  }

  const recentProductsCount = await countProducts(1);
  
  return {total: allItems.length, synced: recentProductsCount, totalPages: totalPages};
}

const EBAY = {
    oAuthToken,
    getProducts
};

module.exports = { default: EBAY };
