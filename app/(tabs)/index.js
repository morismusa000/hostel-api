const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/hostel_complaint')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Hostel Complaint App API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});