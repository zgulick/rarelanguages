#!/usr/bin/env python3

def find_problematic_backticks():
    with open('learning-app-react.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    in_template = False
    template_start_line = 0
    
    for i, line in enumerate(lines, 1):
        if 'res.send(`' in line:
            in_template = True
            template_start_line = i
            continue
        
        if in_template and line.strip() == '`);':
            print(f"Template literal ends at line {i}")
            break
        
        if in_template and '`' in line and 'res.send(`' not in line and '`);' not in line:
            # Found a backtick inside the template
            backtick_pos = line.find('`')
            print(f"Line {i}: Unescaped backtick at position {backtick_pos}")
            print(f"Content: {line.strip()}")
            print()

find_problematic_backticks()