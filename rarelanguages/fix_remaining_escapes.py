#!/usr/bin/env python3

def fix_remaining_escapes():
    with open('react-app.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix all remaining \` patterns - replace with regular `
    content = content.replace('\\`', '`')
    
    # Fix any remaining \${ patterns - replace with ${
    content = content.replace('\\${', '${')
    
    with open('react-app.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed all remaining escape sequences in react-app.html")

if __name__ == "__main__":
    fix_remaining_escapes()