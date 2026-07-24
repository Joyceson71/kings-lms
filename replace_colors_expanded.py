import os
import re

replacements = {
    r'bg-\[#0[a-fA-F0-9]{5}\]': 'bg-background',
    r'bg-\[#1[a-fA-F0-9]{5}\]': 'bg-muted',
    r'border-\[#[a-fA-F0-9]{6}\]': 'border-border',
    r'hover:bg-\[#[a-fA-F0-9]{6}\]': 'hover:bg-muted',
    r'text-white': 'text-foreground',
    r'text-zinc-\d00': 'text-muted-foreground',
    r'text-slate-\d00': 'text-muted-foreground',
    r'hover:text-white': 'hover:text-foreground',
    r'hover:border-\[#[a-fA-F0-9]{6}\]': 'hover:border-border',
}

def main():
    for r, d, files in os.walk('src'):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                path = os.path.join(r, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                new_content = content
                for pattern, repl in replacements.items():
                    new_content = re.sub(pattern, repl, new_content)
                
                if new_content != content:
                    print(f'Updated {path}')
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(new_content)

if __name__ == '__main__':
    main()
