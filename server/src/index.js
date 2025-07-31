const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
const app = express();

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/supplymitralink';

const globalErrorHandler = require('./controllers/error.controller');
const routes = require('./routers');

app.use(cors());
app.use(express.json());
// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true
}));

// Add a specific route for image uploads to ensure they're served correctly
app.use('/public/img/uploads', express.static(path.join(__dirname, '..', 'public', 'img', 'uploads'), {
  maxAge: '7d', // Cache images for 7 days
  etag: true,
  lastModified: true
}));

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            // Server started successfully
        });
    })
    .catch(err => {
        // MongoDB connection error
    });

app.get('/', (req, res) => {
    res.send('Welcome to SupplyMitraLink API');
});

// Routers
app.use('/api', routes)

// Global error handler
app.use(globalErrorHandler);


module.exports = app;
