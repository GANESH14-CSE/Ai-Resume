import os

d = r'c:\Users\Admin\Pictures\Ai Resume\frontend\src'
for root, _, files in os.walk(d):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            content = content.replace('emerald', 'cyan')
            content = content.replace('16,185,129', '6,182,212') # emerald rgb to cyan rgb
            
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
