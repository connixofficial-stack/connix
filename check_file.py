with open('app/admin/home-components/create/career/page.tsx', 'rb') as f:
    content = f.read()
    print(f'Total bytes: {len(content)}')
    print(f'Last 100 bytes: {repr(content[-100:])}')
