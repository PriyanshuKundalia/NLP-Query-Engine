import sqlite3
import os

# Try different possible database paths
db_paths = ['backend/nlp_query_engine.db', 'nlp_query_engine.db', 'backend/data/nlp_query_engine.db']
db_path = None

for path in db_paths:
    if os.path.exists(path):
        db_path = path
        break

if not db_path:
    print('No database found!')
    exit()

print(f'Using database: {db_path}')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f'Tables: {tables}')

    # Check flipkart table specifically
    if 'flipkart_bbd_sales_medium' in tables:
        cursor.execute('SELECT COUNT(*) FROM flipkart_bbd_sales_medium')
        count = cursor.fetchone()[0]
        print(f'flipkart_bbd_sales_medium rows: {count}')
        
        # Get column names
        cursor.execute('PRAGMA table_info(flipkart_bbd_sales_medium)')
        columns = cursor.fetchall()
        print('Columns:', [(col[1], col[2]) for col in columns])
        
        # Get sample data
        cursor.execute('SELECT * FROM flipkart_bbd_sales_medium LIMIT 3')
        rows = cursor.fetchall()
        print('Sample data:')
        for i, row in enumerate(rows):
            print(f'Row {i+1}:', row)
            
        # Try the specific query that was failing
        print('\n--- Testing Mumbai query ---')
        cursor.execute("SELECT * FROM flipkart_bbd_sales_medium WHERE region = 'mumbai' LIMIT 5")
        mumbai_rows = cursor.fetchall()
        print(f'Mumbai results (exact): {len(mumbai_rows)} rows')
        
        # Try case insensitive
        cursor.execute("SELECT * FROM flipkart_bbd_sales_medium WHERE LOWER(region) = 'mumbai' LIMIT 5")
        mumbai_rows_lower = cursor.fetchall()
        print(f'Mumbai results (lowercase): {len(mumbai_rows_lower)} rows')
        
        # Get unique regions
        cursor.execute("SELECT DISTINCT region FROM flipkart_bbd_sales_medium LIMIT 10")
        regions = [row[0] for row in cursor.fetchall()]
        print(f'Sample regions: {regions}')
        
    else:
        print('flipkart_bbd_sales_medium table not found')
        
except Exception as e:
    print(f'Error: {e}')
finally:
    conn.close()