#!/usr/bin/env python3

with open('react-app.html', 'r') as f:
    content = f.read()
    
# Check for remaining escape patterns
escaped_backticks = content.count('\\`')
escaped_dollars = content.count('\\${')

print(f'Remaining escaped backticks: {escaped_backticks}')
print(f'Remaining escaped template vars: {escaped_dollars}')

if escaped_backticks == 0 and escaped_dollars == 0:
    print('✅ All escape sequences have been removed!')
else:
    print('❌ Still have escape sequences to fix')