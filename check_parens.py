#!/usr/bin/env python3

with open('/Users/zgulick/Downloads/rarelanguages/learning-app-react.js', 'r') as f:
    content = f.read()

# Find res.send( position
res_send_pos = content.find('res.send(')
if res_send_pos != -1:
    # Find the corresponding closing parenthesis by counting parentheses
    paren_count = 0
    start_search = res_send_pos + len('res.send(')
    
    for i, char in enumerate(content[start_search:], start_search):
        if char == '(':
            paren_count += 1
        elif char == ')':
            if paren_count == 0:
                # This should be the closing paren for res.send
                closing_pos = i
                break
            else:
                paren_count -= 1
    else:
        print('No matching closing parenthesis found!')
        exit()
    
    # Check what comes right after the closing paren
    after_close = content[closing_pos:closing_pos+10]
    print(f'Found closing paren at position {closing_pos}')
    print(f'Content after closing paren: {repr(after_close)}')
    
    # Check if it ends with semicolon
    line_end = content.find('\n', closing_pos)
    if line_end != -1:
        line_content = content[closing_pos:line_end]
        print(f'Rest of line: {repr(line_content)}')
else:
    print('res.send( not found')