const express = require('express');
const { query } = require('./lib/database');
const path = require('path');

const app = express();
const port = 3002; // New port for React version

app.use(express.json());
app.use(express.static('public'));

// Development: No cache for instant updates
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Main React application
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🇦🇱 Learn Albanian - Kosovo Family Integration</title>
  res.send("test");
});

app.listen(3002, () => {
  console.log("Test");
});
