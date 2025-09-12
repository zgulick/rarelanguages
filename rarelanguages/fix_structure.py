#!/usr/bin/env python3

def fix_template_structure():
    with open('learning-app-react.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the template literal boundaries
    start_marker = "res.send(`"
    end_marker = "`);\n});"
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker, start_idx)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find template boundaries")
        return
    
    # Extract the parts
    before_template = content[:start_idx]
    template_content = content[start_idx + len(start_marker):end_idx]
    after_template = content[end_idx + 2:]  # Skip the `);
    
    # Instead of using template literal, use regular string concatenation
    # This avoids ALL backtick issues
    new_structure = before_template + '''res.send(`''' + template_content + '''`);
});''' + after_template
    
    # Now fix all the backticks in the template content by double-escaping them
    # Find all backticks that aren't already escaped and escape them properly
    lines = new_structure.split('\n')
    fixed_lines = []
    
    in_template = False
    for i, line in enumerate(lines):
        if 'res.send(`' in line:
            in_template = True
            fixed_lines.append(line)
        elif in_template and line.strip() == '`);':
            in_template = False
            fixed_lines.append(line)
        elif in_template:
            # This line is inside the template literal
            # Replace all unescaped backticks with escaped ones
            fixed_line = line.replace('`', '\\`').replace('${', '\\${')
            fixed_lines.append(fixed_line)
        else:
            fixed_lines.append(line)
    
    fixed_content = '\n'.join(fixed_lines)
    
    with open('learning-app-react.js', 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print("Fixed template literal structure")

if __name__ == "__main__":
    fix_template_structure()