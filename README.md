# NLP Query Engine

A small, user-friendly app that lets you upload CSV files and query them using plain English. The frontend is built with React and the backend uses FastAPI + SQLite. The app converts natural-language questions to SQL, runs them against your uploaded data, and returns results instantly.

## Key features
- Upload CSV files (drag & drop)
- Ask questions in plain English — the server generates SQL automatically
- Instant results with formatted tables
- Works with any CSV dataset
- Export query results as CSV
- Lightweight: SQLite for storage, Pandas for processing

## Quick start

Prerequisites
- Python 3.8+
- Node.js 16+
- (Windows) Git and a terminal like PowerShell or Windows Terminal

Install and run

1. Clone the repo
```bash
git clone <your-repo-url>
cd "NLP Query Engine project"
```

2. Start the backend
```bash
cd backend
pip install -r requirements.txt
python final_server.py
# Backend runs at http://localhost:8000 by default
```

3. Start the frontend (new terminal)
```bash
cd src
npm install
npm start
# Frontend runs at http://localhost:3000
```

## How to use

1. Upload a CSV
   - Open the app, go to the "Upload" tab and drop your CSV file.
   - The backend will create or update an SQLite table from the CSV.

2. Ask questions
   - Switch to the "Query" tab and type natural-language questions such as:
     - "Show all records where price > 100"
     - "Count orders by region"
     - "What is the average sales amount per month?"

3. View and export results
   - Results show in a table alongside the generated SQL.
   - Export the displayed results as CSV if needed.

## Example queries

Iris dataset:
- "Show all flowers where petal_width > 1"
- "Count flowers by species"

Sales dataset:
- "List top selling products"
- "Find average revenue per month"

## API (main endpoints)
- GET /api/connections — check DB connection
- GET /api/schema — list tables and schemas
- POST /api/upload — upload CSV (multipart/form-data)
- POST /api/query — run a natural-language query (returns SQL + rows)

## Project structure
```
NLP Query Engine project/
├── backend/
│   ├── final_server.py          # FastAPI server
│   ├── requirements.txt
│   └── final_database.db        # SQLite (auto-created)
├── src/
│   ├── components/
│   │   ├── DocumentUploader.js
│   │   ├── QueryPanel.js
│   │   ├── ResultsView.js
│   │   └── DatabaseConnector.js
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Tips & notes
- CSVs should include a header row with column names.
- Large CSVs may take longer to process; consider sampling or increasing memory.
- The SQL generation tries to be safe, but review queries before running on sensitive data.

## Troubleshooting
- Backend not starting: ensure Python deps are installed and port 8000 is free.
- Frontend not loading: run `npm install` inside `src`, then `npm start`.
- Upload errors: check CSV encoding (UTF-8 recommended) and header validity.

## Contributing
1. Fork the repo
2. Create a branch (feature/your-change)
3. Commit and open a pull request

## License
MIT — free to use and modify.

If you want, I can:
- polish the frontend copy (UI labels/messages),
- produce sample CSVs and example queries,
- or add a short troubleshooting guide inside the app UI.
```// filepath: c:\Users\priya\OneDrive\Desktop\NLP Query Engine project\README.md
# NLP Query Engine

A small, user-friendly app that lets you upload CSV files and query them using plain English. The frontend is built with React and the backend uses FastAPI + SQLite. The app converts natural-language questions to SQL, runs them against your uploaded data, and returns results instantly.

## Key features
- Upload CSV files (drag & drop)
- Ask questions in plain English — the server generates SQL automatically
- Instant results with formatted tables
- Works with any CSV dataset
- Export query results as CSV
- Lightweight: SQLite for storage, Pandas for processing

## Quick start

Prerequisites
- Python 3.8+
- Node.js 16+
- (Windows) Git and a terminal like PowerShell or Windows Terminal

Install and run

1. Clone the repo
```bash
git clone <your-repo-url>
cd "NLP Query Engine project"
```

2. Start the backend
```bash
cd backend
pip install -r requirements.txt
python final_server.py
# Backend runs at http://localhost:8000 by default
```

3. Start the frontend (new terminal)
```bash
cd src
npm install
npm start
# Frontend runs at http://localhost:3000
```

## How to use

1. Upload a CSV
   - Open the app, go to the "Upload" tab and drop your CSV file.
   - The backend will create or update an SQLite table from the CSV.

2. Ask questions
   - Switch to the "Query" tab and type natural-language questions such as:
     - "Show all records where price > 100"
     - "Count orders by region"
     - "What is the average sales amount per month?"

3. View and export results
   - Results show in a table alongside the generated SQL.
   - Export the displayed results as CSV if needed.

## Example queries

Iris dataset:
- "Show all flowers where petal_width > 1"
- "Count flowers by species"

Sales dataset:
- "List top selling products"
- "Find average revenue per month"

## API (main endpoints)
- GET /api/connections — check DB connection
- GET /api/schema — list tables and schemas
- POST /api/upload — upload CSV (multipart/form-data)
- POST /api/query — run a natural-language query (returns SQL + rows)

## Project structure
```
NLP Query Engine project/
├── backend/
│   ├── final_server.py          # FastAPI server
│   ├── requirements.txt
│   └── final_database.db        # SQLite (auto-created)
├── src/
│   ├── components/
│   │   ├── DocumentUploader.js
│   │   ├── QueryPanel.js
│   │   ├── ResultsView.js
│   │   └── DatabaseConnector.js
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Tips & notes
- CSVs should include a header row with column names.
- Large CSVs may take longer to process; consider sampling or increasing memory.
- The SQL generation tries to be safe, but review queries before running on sensitive data.

## Troubleshooting
- Backend not starting: ensure Python deps are installed and port 8000 is free.
- Frontend not loading: run `npm install` inside `src`, then `npm start`.
- Upload errors: check CSV encoding (UTF-8 recommended) and header validity.

## Contributing
1. Fork the repo
2. Create a branch (feature/your-change)
3. Commit and open a pull request

## License
MIT — free to use and modify.

If you want, I can:
- polish the frontend copy (UI labels/messages),
- produce sample CSVs and example queries,
- or add a short troubleshooting guide inside the app UI.
