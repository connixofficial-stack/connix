with open('app/admin/home-components/create/career/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    open_count = content.count('{')
    close_count = content.count('}')
    print(f'Open braces: {open_count}')
    print(f'Close braces: {close_count}')
    print(f'Difference: {open_count - close_count}')
