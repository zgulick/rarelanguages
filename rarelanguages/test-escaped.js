const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<script>
// Test multiple escaped template literals
const test1 = \`Hello \${world}\`;
const test2 = \`Another \${variable} here\`;
const className = \`class-\${index === 0 ? 'active' : ''}\`;
</script>
</body>
</html>
  `);
});

app.listen(3000);