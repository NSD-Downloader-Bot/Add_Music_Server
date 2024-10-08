const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
const keep_alive = require('./keep_alive.js')

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

const https = require('https');

https.get('https://api.ipify.org?format=json', (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        console.log(JSON.parse(data).ip);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});



mongoose.connect("mongodb+srv://tigersinghtiger9648:intelcorei5+mongodb@cluster0.fkh7qwf.mongodb.net/NSD_MUSIC?retryWrites=true&w=majority&tls=true", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})


mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Error connecting to MongoDB:', err);
});

const musicSchema = new mongoose.Schema({
    "Sr": Number,
    "URL": String,
    "createdBy" : String,
    "time" : String,
    "video_id" : String
}, {
    versionKey: false // Disable __v field
});

// Specify the collection name explicitly as "music"
const music = mongoose.model('music', musicSchema, 'music');

app.get('/', (req, res) => {
    res.send('Server is running');
});


// API endpoint to fetch all music
app.get('/api/music', async (req, res) => {
    try {
        const Task = await music.find();
        res.json(Task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch music' });
    }
});

app.post(`/api/add/music`, async (req, res) => {
    try {
        const { URL, createdBy, video_id } = req.body;

        // Check if the URL already exists in the collection
        const existingItem = await music.findOne({ video_id });

        if (existingItem) {
            return res.status(400).send('URL already exists in the database.');
        }

        // Find the last document to get the highest Sr value
        const lastDocument = await music.findOne().sort({ Sr: -1 });

        // Set Sr value for the new document
        const newSr = lastDocument ? lastDocument.Sr + 1 : 1;

        // Create a new document with the incremented Sr, URL, createdBy, and current time
        const newTodoItem = new music({
            "Sr": newSr,
            "URL": URL,
            "createdBy": createdBy, // add the createdBy from the request
            "time": new Date().toISOString(),// add the current time
            "video_id" : video_id
        });

        // Save the new document
        await newTodoItem.save();

        res.status(201).send('Text saved to database successfully!');

    } catch (error) {
        console.error('Error saving text to database:', error);
        res.status(500).send('Internal server error');
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
