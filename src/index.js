const express = require('express');
require('dotenv').config();
const cors = require('cors');


const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const quoteRoutes = require('./routes/quotes');
const ebayRoutes = require('./routes/ebay');

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/quotes', quoteRoutes);
app.use('/api/ebay', ebayRoutes);

app.get('/', (req, res) => res.send('Marine machines backend up'));


const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
