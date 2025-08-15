// File: app.js

const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables

const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Set up the main API route
app.use('/api/users', userRoutes);

// Add a simple homepage for browser access
app.get('/', (req, res) => {
    res.send('Welcome to the User Management API. Please use a tool like Postman to interact with the API endpoints.');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log('API Endpoints are now handled by routes/userRoutes.js');
});