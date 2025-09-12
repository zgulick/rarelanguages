#!/usr/bin/env python3

def fix_html_escapes():
    with open('react-app.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove all the escape characters that were added for server-side template literals
    # Since this is now a standalone HTML file, we need regular template literals
    
    # Fix escaped backticks: \` -> `
    content = content.replace('\\`', '`')
    
    # Fix escaped template variables: \${...} -> ${...}
    content = content.replace('\\${', '${')
    
    # Write the fixed HTML
    with open('react-app.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed all escaped template literals in react-app.html")

if __name__ == "__main__":
    fix_html_escapes()