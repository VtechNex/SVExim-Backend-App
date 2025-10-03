const express = require('express');
require('dotenv').config();
const cors = require('cors');


const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const quoteRoutes = require('./routes/quotes');


const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/quotes', quoteRoutes);


app.get('/', (req, res) => res.send('Marine machines backend up'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
