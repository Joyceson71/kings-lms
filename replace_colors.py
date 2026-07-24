import os
import re

def main():
    for r, d, files in os.walk('src'):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                path = os.path.join(r, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                new_content = re.sub(r'bg-\[#1f1f23\]', 'bg-muted', content)
                new_content = re.sub(r'border-\[#1f1f23\]', 'border-border', new_content)
                new_content = re.sub(r'bg-\[#111113\]', 'bg-card', new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(new_content)

if __name__ == '__main__':
    main()
