#!/usr/bin/env python3

def fix_jsx_escapes():
    with open('react-app.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix JSX template literal expressions that got over-escaped
    # Pattern: {\`...${...}...\`} should be {`...${...}...`}
    
    import re
    
    # Find all instances of {\`...\`} and fix them
    pattern = r'\{\\`([^`]*\$\{[^}]+\}[^`]*?)\\`\}'
    
    def replace_match(match):
        inner_content = match.group(1)
        # Remove escape characters from the inner content
        inner_content = inner_content.replace('\\${', '${')
        return '{`' + inner_content + '`}'
    
    content = re.sub(pattern, replace_match, content)
    
    # Also fix simpler cases like {\`text\`}
    content = re.sub(r'\{\\`([^`]*?)\\`\}', r'{`\1`}', content)
    
    # Fix any remaining \${ patterns
    content = content.replace('\\${', '${')
    
    with open('react-app.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed JSX template literal escapes")

if __name__ == "__main__":
    fix_jsx_escapes()