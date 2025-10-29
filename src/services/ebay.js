const axios = require('axios');
const { stringify } = require('qs');
const dotenv = require('dotenv');
const { saveEbayToken } = require('../db');
dotenv.config();


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

async function getProducts(user, res) {
    try {
        const accessToken = user.access_token;

        // Sell Inventory API (seller's own listings)
        const ebayUrl = "https://api.ebay.com/sell/inventory/v1/inventory_item";

        // Call eBay API
        const response = await axios.get(ebayUrl, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US", // Required for most APIs
        },
        });

        // Return the product list
        return res.status(200).json({
            success: true,
            products: response.data
        });
    } catch (error) {
        console.error("Error fetching eBay products:", error.response?.data || error.message);
        return res.status(500).json({
            error: "Failed to fetch eBay products",
            details: error.response?.data || error.message,
        });
    }
}

async function addProductToInventory(
    user, 
    sku, 
    title, 
    description,
    quantity, 
    imageUrls, 
    res
) {
    try {
        const accessToken = user.access_token;
        const ebayUrl = `https://api.ebay.com/sell/inventory/v1/inventory_item/${sku}`;

        const payload = {
            product: {
                title,
                description,
                aspects: {
                    Brand: ["Generic"],
                },
                imageUrls: imageUrls || ["https://via.placeholder.com/600"], // ✅ use provided array
            },
            condition: "NEW",
            availability: {
                shipToLocationAvailability: {
                    quantity: parseInt(quantity),
                },
            },
            packageWeightAndSize: {
                dimensions: {
                    height: 10,
                    length: 10,
                    width: 10,
                    unit: "INCH",
                },
                weight: {
                    value: 1,
                    unit: "POUND",
                },
            },
        };

        const response = await axios.put(ebayUrl, payload, {
            headers: {
                "Content-Type": "application/json",
                "Content-Language": "en-US",
                "Authorization": `Bearer ${accessToken}`,
                "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
            },
        });

        return res.status(200).json({
            success: true,
            message: "Product successfully created in inventory",
            ebay_response: response.data,
        });
    } catch (error) {
        console.error("Error adding product:", error.response?.data || error.message);
        return res.status(500).json({
            error: "Failed to add product to eBay inventory",
            details: error.response?.data || error.message,
        });
    }
}

async function updateProductInInventory(user, sku, title, description, quantity, imageUrls, res) {
    try {
        const access_token = user.access_token;
        const body = {
            locale: "en_US",
            availability: {
                shipToLocationAvailability: {
                    quantity: parseInt(quantity)
                }
            },
            product: {
                title,
                description,
                aspects: {
                    Brand: ["Generic"]
                },
                imageUrls
            },
            condition: "NEW",
            packageWeightAndSize: {
                dimensions: {
                    width: 10,
                    length: 10,
                    height: 10,
                    unit: "INCH"
                },
                weight: {
                    value: 1,
                    unit: "POUND"
                }
            }
        };

        const updateUrl = `https://api.ebay.com/sell/inventory/v1/inventory_item/${sku}`;
        const response = await axios.put(updateUrl, body, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Language': 'en-US',
                'Content-Type': 'application/json'
            }
        });

        if (!response || (response.status !== 200 && response.status !== 204)) {
            return res.status(response?.status || 500).json({ success: false, error: response?.data });
        }

        return res.status(200).json({
            success: true,
            message: `Inventory item ${sku} updated successfully`,
            data: response?.data || {}
        });
    } catch (err) {
        console.error('Error updating inventory item:', err?.response?.data || err.message);
        return res.status(err?.response?.status || 500).json({
            success: false,
            message: 'Error updating inventory item',
            error: err?.response?.data || err.message
        });
    }
}

async function deleteProductFromInventory(user, sku, res) {
    try {
        const ebayUrl = `https://api.ebay.com/sell/inventory/v1/inventory_item/${sku}`;
        const response = await axios.delete(ebayUrl, {
            headers: {
                'Authorization': `Bearer ${user.access_token}`
            }
        });

        if (response.status === 204 || response.status === 200) {
        return res.json({ success: true, message: `Inventory item ${sku} deleted successfully` });
        }

        const data = await response.json();
        res.status(response.status).json({ success: false, error: data });
    } catch (err) {
        console.error('Error deleting inventory item:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}


const EBAY = {
    oAuthToken,
    getProducts,
    addProductToInventory,
    updateProductInInventory,
    deleteProductFromInventory
};

module.exports = { default: EBAY };
