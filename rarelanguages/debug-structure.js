const express = require('express');
const app = express();

// Test the exact same structure as the original
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test</title>
</head>
<body>
    <script type="text/babel">
        const test = \`Hello \${world}\`;
        const className = \`btn-\${active ? 'active' : 'inactive'}\`;
    </script>
</body>
</html>
  `);
});