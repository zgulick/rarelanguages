// Test nested template literals properly
const html = `
<script>
const test = \`Hello \${name}\`;
const className = \`btn-\${active ? 'active' : 'inactive'}\`;
</script>
`;

console.log("Test successful");