const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const axios = require('axios');  // Install axios for HTTP requests
const app = express();

require('dotenv').config();
const uri = process.env.MONGODB_URI;

const helmet = require('helmet');
app.use(helmet());

const cors = require('cors');
app.use(cors({ origin: 'http://localhost:8000' }));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
	
// Example using Express.js
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', 'http://localhost:8000'); // Allow requests from your frontend's origin
     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
     next();
   });

// MongoDB Atlas URI
// const uri = 'mongodb+srv://atinen26:eyeshield21@cluster0.uvcik.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Create a MongoClient instance
const client = new MongoClient(uri, { useNewUrlParser: true });

// MongoDB Database and Collection
let plantLocationsCollection;

// Connect to MongoDB
client.connect()
    .then(() => {
        console.log('Connected to MongoDB');
        const db = client.db('plantspecies'); // Database name
        plantLocationsCollection = db.collection('plant'); // Collection name
    })
    .catch(err => {
	console.error('Could not connect to MongoDB...', err);
	process.exit(1);
    });

// API endpoint to fetch all plant locations
app.get('/plant-locations', async (req, res) => {
    try {
        const className = req.query.className;  // Class filter
        let query = {};
        
        if (className && className !== 'All') {
            query = { className: className };  // Filter by className if provided
        }

        const locations = await plantLocationsCollection.find(query).toArray();
        res.json(locations);  // Send the plant locations as JSON
    } catch (error) {
        console.error('Error fetching plant locations:', error);
        res.status(500).json({ error: 'Failed to fetch locations.' });
    }
});

// Use Nominatim for reverse geocoding
async function getCityFromCoordinates(latitude, longitude) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const response = await axios.get(url);
        const city = response.data.address.city || response.data.address.town || response.data.address.village;
        return city;
    } catch (error) {
        console.error('Error with reverse geocoding:', error);
        return null;  // Return null if there's an error
    }
}

// API endpoint to save plant scan data
app.post('/save-scan', async (req, res) => {
    const { className, timestamp, latitude, longitude, image } = req.body;

    try {
        const scanData = { className, timestamp, latitude, longitude, image };
        const result = await plantLocationsCollection.insertOne(scanData); // Insert the scan data
        res.status(200).json(result);  // Send success response
    } catch (error) {
        console.error('Error saving scan data:', error);
        res.status(500).json({ error: 'Failed to save scan data.' });
    }
});

// Start server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
