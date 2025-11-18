const express = require('express');
const { getBrands, addBrand, updateBrand, deleteBrand } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const brands = await getBrands();
        res.json({
            size: brands.length,
            brands
        });
    } catch (error) {
        res.status(500).send('Error retrieving brands');
    }
});

router.post('/', async (req, res) => {
    try {
        const [name, description, logoUrl] = [req.body.name, req.body.description, req.body.logoUrl];
        await addBrand(name, description, logoUrl);
        res.status(201).send('Brand added successfully');
    } catch (error) {
        res.status(500).send('Error adding brand');
    }
});

router.post('/all', async (req, res) => {
    try {
        const brands = req.body.brands; // Expecting an array of brand objects
        for (const brand of brands) {
            const { name, description, logoUrl } = brand;
            await addBrand(name, description, logoUrl);
        }
        res.status(201).send('All brands added successfully');
    } catch (error) {
        res.status(500).send('Error adding brands');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [name, description, logoUrl] = [req.body.name, req.body.description, req.body.logoUrl];
        await updateBrand(id, name, description, logoUrl);
        res.send(`Brand with ID: ${id} updated successfully`);
    } catch (error) {
        res.status(500).send('Error updating brand');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await deleteBrand(id);
        res.send(`Brand with ID: ${id} deleted successfully`);
    } catch (error) {
        res.status(500).send('Error deleting brand');
    }
});

module.exports = router;
