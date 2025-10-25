const express = require('express');
require('dotenv').config();
const cors = require('cors');
const authenticate = require('./middleware/auth')
require("./jobs/tokenRefresher");


const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const quoteRoutes = require('./routes/quotes');
const adminRoutes = require('./routes/admin');
const ebayRoutes = require('./routes/ebay');

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/quotes', quoteRoutes);
app.use('/api/admin', authenticate, adminRoutes);
app.use('/api/ebay', authenticate, ebayRoutes);

app.get('/', (req, res) => res.send('Marine machines backend up'));


const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // for testing

module.exports = app; // for production 
