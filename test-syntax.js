// Minimal test to check template literal syntax
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<script>
const test = \`Hello \${world}\`;
</script>
</body>
</html>
  `);
});