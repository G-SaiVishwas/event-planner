const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    const { location = 'New York' } = event.queryStringParameters || {};

    const response = await axios.get('https://api.foursquare.com/v3/places/search', {
      headers: {
        'Authorization': process.env.FOURSQUARE_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        query: 'event venues',
        near: location,
        limit: 12,
        sort: 'RATING',
        fields: 'name,rating,price,location,photos,categories,description,tel,website,hours,social_media'
      }
    });

    const venues = response.data.results.map(venue => ({
      id: venue.fsq_id,
      name: venue.name,
      rating: venue.rating || 'N/A',
      price: venue.price?.tier || 'N/A',
      location: venue.location,
      photos: venue.photos || [],
      categories: venue.categories || [],
      description: venue.description || '',
      tel: venue.tel || '',
      website: venue.website || '',
      hours: venue.hours || {},
      socialMedia: venue.social_media || {}
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(venues)
    };
  } catch (error) {
    console.error('Venue API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch venues',
        message: error.message
      })
    };
  }
};