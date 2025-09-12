#!/usr/bin/env python3

def simple_quote_fix():
    with open('react-app.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace all escaped single quotes with double quotes
    content = content.replace("\\'", '"')
    
    with open('react-app.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("All escaped single quotes replaced with double quotes")

if __name__ == "__main__":
    simple_quote_fix()