require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Foursquare API Proxy
app.get('/api/venues', async (req, res) => {
    try {
        const { location, price } = req.query;
        const response = await axios.get('https://api.foursquare.com/v3/places/search', {
            headers: {
                'Authorization': process.env.FOURSQUARE_API_KEY
            },
            params: {
                query: 'event venues',
                near: location,
                price: price,
                limit: 10,
                fields: 'name,rating,price,location,photos,categories,geocodes'
            }
        });
        
        const venues = response.data.results.map(venue => ({
            name: venue.name,
            rating: venue.rating,
            price: venue.price,
            location: venue.location,
            photos: venue.photos,
            categories: venue.categories
        }));
        
        res.json(venues);
    } catch (error) {
        console.error('Foursquare API Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch venues' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});