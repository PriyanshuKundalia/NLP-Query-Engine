# NLP Query Engine

A React + FastAPI application that allows users to upload CSV files and query them using natural language.

## Features

✅ **CSV File Upload**: Drag and drop CSV files to upload and analyze  
✅ **Natural Language Queries**: Ask questions in plain English  
✅ **Smart SQL Generation**: Automatically converts natural language to SQL  
✅ **Real-time Results**: Instant query execution and results display  
✅ **Multi-format Support**: Works with any CSV dataset  

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd "NLP Query Engine project"
```

2. **Setup Backend**
```bash
cd backend
pip install -r requirements.txt
python final_server.py
```

3. **Setup Frontend**
```bash
# In a new terminal
npm install
npm start
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Usage

### 1. Upload Data
- Go to the "Upload" tab
- Drag and drop your CSV file
- Wait for successful upload confirmation

### 2. Query Your Data
- Switch to the "Query" tab
- Type natural language questions like:
  - "Show all records where price > 100"
  - "Count how many items by category"
  - "Find the average sales amount"
  - "List all products with rating above 4"

### 3. View Results
- Results appear instantly in a formatted table
- See the generated SQL query
- Export results as CSV if needed

## Example Queries

For **Iris Dataset**:
- "Show all flowers where petal_width > 1"
- "Count flowers by species"
- "Find flowers with sepal_length > 6"
- "Show only setosa flowers"

For **Sales Dataset**:
- "Show products with price > 50"
- "Count orders by region"
- "Find average revenue per month"
- "List top selling products"

## Project Structure

```
NLP Query Engine project/
├── backend/
│   ├── final_server.py          # Main FastAPI server
│   ├── requirements.txt         # Python dependencies
│   └── final_database.db        # SQLite database (auto-created)
├── src/
│   ├── components/
│   │   ├── DocumentUploader.js  # File upload component
│   │   ├── QueryPanel.js        # Query interface
│   │   ├── ResultsView.js       # Results display
│   │   └── DatabaseConnector.js # Database connection
│   ├── App.js                   # Main React app
│   └── index.js                 # Entry point
├── package.json                 # Frontend dependencies
└── README.md                    # This file
```

## API Endpoints

- `GET /api/connections` - Check database connection
- `GET /api/schema` - Get table schema information
- `POST /api/upload` - Upload CSV file
- `POST /api/query` - Execute natural language query

## Technologies Used

**Frontend:**
- React 18
- Modern CSS with animations
- Drag & drop file upload

**Backend:**
- FastAPI (Python web framework)
- Pandas (Data processing)
- SQLite (Database)
- Uvicorn (ASGI server)

## Deployment

The application is ready for deployment on platforms like:
- Vercel (Frontend)
- Railway/Heroku (Backend)
- Or any VPS with Python and Node.js support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for learning and development.

---

**Made with ❤️ for natural language data querying**
