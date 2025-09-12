#!/usr/bin/env python3

with open('/Users/zgulick/Downloads/rarelanguages/learning-app-react.js', 'r') as f:
    lines = f.readlines()

in_template = False
template_start = 0

for i, line in enumerate(lines):
    if 'res.send(' in line and '`' in line:
        in_template = True
        template_start = i
        print(f'Template starts at line {i+1}')
    elif in_template and line.strip() == '`);':
        print(f'Template ends at line {i+1}')
        # Check the template content for unescaped backticks
        template_lines = lines[template_start:i+1]
        for j, tline in enumerate(template_lines[1:-1], 1):  # Skip first and last line
            if '`' in tline and '\\`' not in tline:
                line_num = template_start + j + 1
                print(f'Unescaped backtick at line {line_num}: {repr(tline.strip()[:100])}')
        break