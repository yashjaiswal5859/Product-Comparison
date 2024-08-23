// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const emailRoutes = require('../routes/email');
const productRoutes = require('../routes/productDB');
const getproductRoutes = require('../routes/scrap');
const cheerio = require('cheerio');
const axios = require('axios');



const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = 'mongodb://localhost:27017/Product_app';
let data = [];

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/product', productRoutes);
app.use('/api/get_product', getproductRoutes);



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
