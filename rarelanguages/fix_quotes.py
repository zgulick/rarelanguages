#!/usr/bin/env python3

def fix_escaped_quotes():
    with open('react-app.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix escaped single quotes in JavaScript strings
    # Replace \' with ' inside string literals
    fixes = [
        ("'Hajde të hamë (Let\\'s eat)'", "'Hajde të hamë (Let\"s eat)'"),
        ("'Është e shijshme (It\\'s tasty)'", "'Është e shijshme (It\"s tasty)'"),
        ("'I think it\\'s good'", "'I think it\"s good'"),
        ("'I believe it\\'s right'", "'I believe it\"s right'"),
        ("'Mendoj se është mirë (I think it\\'s good)'", "'Mendoj se është mirë (I think it\"s good)'"),
        ("'You look sad)', usage: 'Noticing family member\\'s emotional state'", "'You look sad)', usage: 'Noticing family member\"s emotional state'"),
        ("'I say good morning at 8 o\\'clock)'", "'I say good morning at 8 o\"clock)'"),
        ("'Mendoj se është e drejtë (I think it\\'s right)'", "'Mendoj se është e drejtë (I think it\"s right)'"),
        ("'let\\'s eat together'", "'let\"s eat together'"),
        ("'let\\'s start a game'", "'let\"s start a game'"),
        ("'who\\'s next'", "'who\"s next'")
    ]
    
    for old, new in fixes:
        if old in content:
            content = content.replace(old, new)
            print(f"Fixed: {old}")
        else:
            print(f"Not found: {old}")
    
    with open('react-app.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("All escaped quotes have been fixed")

if __name__ == "__main__":
    fix_escaped_quotes()