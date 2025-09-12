#!/usr/bin/env python3
import re

def fix_template_literals():
    with open('learning-app-react.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find template literal boundaries
    start_pattern = "res.send(`"
    end_pattern = "`);\n});"
    
    start_idx = content.find(start_pattern)
    end_idx = content.find(end_pattern, start_idx)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find template literal boundaries")
        return False
    
    # Extract parts
    before_template = content[:start_idx + len(start_pattern)]
    template_content = content[start_idx + len(start_pattern):end_idx]
    after_template = content[end_idx:]
    
    # Fix escaped backticks in className attributes and template strings
    # Pattern: \`${...}\` should become `${...}`
    template_content = re.sub(r'\\`(\$\{[^}]+\})', r'`\1', template_content)
    template_content = re.sub(r'(\$\{[^}]+\})\\`', r'\1`', template_content)
    
    # Fix className={\`...\`} patterns
    template_content = re.sub(r'className=\{\\`([^`]+)\\`\}', r'className={`\1`}', template_content)
    
    # Fix other template literal patterns
    template_content = re.sub(r'\\`([^`\\]+)\\`', r'`\1`', template_content)
    
    # Reconstruct
    fixed_content = before_template + template_content + after_template
    
    with open('learning-app-react-fixed.js', 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print("Fixed template literals. Output: learning-app-react-fixed.js")
    return True

if __name__ == "__main__":
    fix_template_literals()