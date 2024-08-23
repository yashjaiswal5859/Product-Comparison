const express = require('express');
const router = express.Router();
const Product = require('../model/Product'); // Ensure the correct path to your model

// Route to fetch product data by search term
router.get('/show', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    try {
        const product = await Product.findById(url);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ data: product.products });
    } catch (error) {
        console.error('Error fetching product data:', error);
        res.status(500).json({ error: 'Error fetching product data' });
    }
});








module.exports = router;
