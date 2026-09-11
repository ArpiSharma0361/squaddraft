
import base64, sys

def save(filepath, b64_content):
    with open(filepath, 'wb') as f:
        f.write(base64.b64decode(b64_content.strip()))
    print(f'Saved {filepath}')
