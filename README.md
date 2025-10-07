# NLP Query Engine

A powerful React + FastAPI application that transforms natural language questions into SQL queries using **Groq AI**, allowing users to upload CSV files and analyze data conversationally.

## 🚀 Features

✅ **AI-Powered NL→SQL**: Uses Groq AI (llama-3.1-8b-instant) for intelligent query conversion  
✅ **Rule-Based Fallback**: Automatic fallback to pattern-based queries when AI is unavailable  
✅ **CSV File Upload**: Drag and drop CSV files to upload and analyze  
✅ **Natural Language Queries**: Ask questions in plain English  
✅ **Smart SQL Generation**: Handles complex filtering, aggregation, and analysis  
✅ **Real-time Results**: Instant query execution and results display  
✅ **Multi-format Support**: Works with any CSV dataset  
✅ **Column Auto-Detection**: Automatically handles special characters in column names  
✅ **Safety Checks**: Prevents harmful SQL operations (DROP, DELETE, etc.)  

## 🎯 AI Query Examples

**Filtering & Comparison:**
- "Show me products where discount is greater than 30 percent"
- "Find all orders from Mumbai with price above 1000"
- "List customers who purchased Electronics items"

**Aggregation & Analysis:**
- "What's the average sale price by category?"
- "Count total orders per region"
- "Show top 10 best selling products"

**Complex Queries:**
- "Find products with highest ratings in each category"
- "Show monthly revenue trends"
- "Compare sales performance across regions"  

## 🛠️ Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Groq API key (free at https://console.groq.com/)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd "NLP Query Engine project"
```

2. **Setup Backend**
```bash
cd backend

# Create virtual environment (recommended)
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

3. **Configure AI (Required for AI Mode)**
```bash
# Create .env file in backend folder
echo "OPENAI_API_BASE=https://api.groq.com/openai/v1" > .env
echo "OPENAI_API_KEY=your_groq_api_key_here" >> .env
```

**🔑 Get your free Groq API key:**
- Visit https://console.groq.com/
- Sign up (free)
- Go to "API Keys" 
- Create new key
- Copy and paste into `.env` file

4. **Start Backend**
```bash
python final_server.py
# Server runs on http://localhost:8000
```

5. **Setup Frontend** (new terminal)
```bash
# In project root
npm install
npm start
# Frontend runs on http://localhost:3000
```

6. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 📝 Usage

### 1. Upload Data
- Go to the "Upload" tab or use the upload section
- Drag and drop your CSV file or click to browse
- Wait for successful upload confirmation
- Database schema will auto-detect column names and types

### 2. Query Your Data

**🤖 AI Mode (Recommended):**
- Toggle "AI Mode Active" in the query panel
- Type natural language questions in any phrasing:
  - "Show me products where discount > 30%"
  - "What's the average price by category?"
  - "Find top 5 sellers in Mumbai"
  - "List all electronics with rating above 4"

**📋 Pattern Mode (Fallback):**
- Uses rule-based patterns for common queries
- Works offline and is very fast
- Handles basic filtering and aggregation

### 3. View Results
- Results appear instantly in a formatted table
- See the generated SQL query for transparency
- View execution time and row count
- Toggle between Table and JSON view
- Export results as CSV

### 4. Error Handling
- Invalid queries show helpful error messages
- AI automatically falls back to pattern matching if API fails
- Column name mismatches are automatically corrected

## 💡 Example Queries

### For **E-commerce/Sales Data** (Flipkart dataset):
```
🛒 Product Analysis:
- "Show me all electronics with discount above 25%"
- "Find products priced between 500 and 2000"
- "List top 10 highest rated items"

📊 Sales Analytics:
- "What's the total revenue by region?"
- "Show average discount percentage by category"
- "Find best selling products in Delhi"

📈 Business Intelligence:
- "Compare sales performance across payment methods"
- "Show monthly revenue trends"
- "Which categories have highest profit margins?"
```

### For **General Datasets**:
```
🔍 Data Exploration:
- "Show me first 10 rows"
- "Count total records"
- "What columns are available?"

📋 Filtering:
- "Find records where [column] > [value]"
- "Show only [category] items"
- "Filter by date range from [start] to [end]"

🧮 Aggregation:
- "Calculate average [column] by [group]"
- "Sum total [amount] per [category]"
- "Count unique [items] in each [group]"
```

## 🏗️ Project Structure

```
NLP Query Engine project/
├── backend/
│   ├── final_server.py          # Main FastAPI server with AI integration
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (API keys)
│   ├── final_database.db        # SQLite database (auto-created)
│   └── .venv/                   # Virtual environment (recommended)
├── src/
│   ├── components/
│   │   ├── DocumentUploader.js  # CSV file upload component
│   │   ├── QueryPanel.js        # Query interface with AI toggle
│   │   ├── ResultsView.js       # Results display and export
│   │   ├── DatabaseConnector.js # Database connection status
│   │   └── MetricsDashboard.js  # Performance metrics
│   ├── App.js                   # Main React application
│   └── index.js                 # Entry point
├── package.json                 # Frontend dependencies
├── README.md                    # This documentation
└── .gitignore                   # Git ignore (includes .env)
```

## 🔌 API Endpoints

### Core Endpoints:
- `GET /api/connections` - Check database connection status
- `GET /api/schema` - Get table schema and column information  
- `POST /api/upload` - Upload CSV file to database
- `POST /api/query` - Execute rule-based natural language query
- `POST /api/ai-query` - Execute AI-powered natural language query

### Request/Response Examples:

**AI Query:**
```json
POST /api/ai-query
{
  "query": "Show products where discount > 30",
  "table": "flipkart_bbd_sales_medium"
}

Response:
{
  "success": true,
  "query": "Show products where discount > 30",
  "sql_generated": "SELECT * FROM flipkart_bbd_sales_medium WHERE `Discount%` > 30 LIMIT 100",
  "confidence": 0.9,
  "results": [...],
  "total_results": 45,
  "source": "groq",
  "metadata": {"database": "flipkart_bbd_sales_medium"}
}
```

## 🛠️ Technologies Used

**Frontend:**
- React 18 with modern hooks
- CSS3 with animations and responsive design
- Drag & drop file upload interface
- Real-time query results and visualizations

**Backend:**
- FastAPI (High-performance Python web framework)
- Groq AI API (llama-3.1-8b-instant model)
- Pandas (Data processing and CSV handling)
- SQLite (Lightweight database with auto-schema detection)
- Uvicorn (ASGI server for production-ready deployment)
- Python-dotenv (Environment variable management)

**AI & NLP:**
- Groq Cloud AI (Fast and free LLM inference)
- Custom prompt engineering for SQL generation
- Automatic fallback to rule-based parsing
- Column name normalization and special character handling

**Security & Reliability:**
- SQL injection prevention
- Query validation and sanitization
- Rate limiting and timeout handling
- Automatic error recovery

## 🚀 Deployment

### Local Development
Already covered in Quick Start section above.

### Production Deployment

**Option 1: Cloud Platforms**
- **Frontend**: Deploy to Vercel, Netlify, or GitHub Pages
- **Backend**: Deploy to Railway, Render, or Heroku
- Set environment variables in platform dashboard

**Option 2: VPS/Server**
```bash
# Install dependencies
sudo apt update
sudo apt install python3 python3-pip nodejs npm

# Setup application
git clone <repo-url>
cd "NLP Query Engine project"

# Backend
cd backend
pip3 install -r requirements.txt
# Set OPENAI_API_KEY in environment
export OPENAI_API_KEY="your_groq_key"
python3 final_server.py

# Frontend (in new terminal)
npm install
npm run build
npx serve -s build -l 3000
```

**Option 3: Docker** (Future enhancement)
Ready for containerization with Docker and Docker Compose.

## 🔐 Environment Variables

Create `backend/.env` file with:
```env
# Groq AI Configuration (Required for AI mode)
OPENAI_API_BASE=https://api.groq.com/openai/v1
OPENAI_API_KEY=your_groq_api_key_here

# Optional: Hugging Face fallback
HUGGINGFACE_API_TOKEN=your_hf_token_here
HUGGINGFACE_MODEL=google/flan-t5-small

# Security: DO NOT COMMIT .env TO GIT
```

**🚨 Security Note:** Never commit `.env` files to version control. The `.gitignore` already excludes them.

## 🐛 Troubleshooting

### Common Issues:

**1. "AI Mode not working"**
- Check if `OPENAI_API_KEY` is set in `backend/.env`
- Verify Groq API key is valid at https://console.groq.com/
- Check internet connection to api.groq.com

**2. "Column not found" errors**
- The AI automatically detects and handles special characters
- For manual queries, use backticks: `Discount%` not `Discount`

**3. "Port 8000 already in use"**
```bash
# Kill existing process
netstat -ano | findstr :8000
taskkill /PID <process_id> /F
```

**4. "Module not found" errors**
```bash
# Ensure virtual environment is activated
cd backend
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Debug Mode:
Set environment variable `DEBUG=1` to see detailed API logs and SQL generation process.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Add new AI prompt templates
   - Improve query patterns
   - Enhance UI/UX
   - Add new data visualization features
4. **Test thoroughly**
   ```bash
   # Test backend
   cd backend && python -m pytest
   
   # Test frontend
   npm test
   ```
5. **Submit a pull request**

### Ideas for Contributions:
- 📊 Add chart/graph visualizations
- 🗃️ Support for JSON, Excel, and other data formats  
- 🧠 Additional AI model integrations (OpenAI, Anthropic)
- 🎨 UI/UX improvements and themes
- 📱 Mobile responsive design enhancements
- 🔍 Advanced query history and saved queries
- 📈 Real-time data streaming capabilities

## 📄 License

MIT License - feel free to use this project for learning and development.

```
Copyright (c) 2025 NLP Query Engine

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🙏 Acknowledgments

- **Groq** for providing fast and free AI inference
- **FastAPI** for the excellent Python web framework
- **React** community for modern frontend tools
- **Open source** contributors and the developer community

---

## 🌟 Star this repo if it helped you!

**Made with ❤️ for natural language data querying**

### Quick Links:
- 🐛 [Report Bug](https://github.com/PriyanshuKundalia/nlp-query-engine/issues)
- 💡 [Request Feature](https://github.com/PriyanshuKundalia/nlp-query-engine/issues)
- 📖 [Documentation](https://github.com/PriyanshuKundalia/nlp-query-engine/wiki)
- 💬 [Discussions](https://github.com/PriyanshuKundalia/nlp-query-engine/discussions)
