# Git Commands for Submission

## Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Complete NLP Query Engine"
```

## Push to GitHub
```bash
# Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Or if repository already exists
```bash
git add .
git commit -m "Final submission: Clean NLP Query Engine with CSV upload and natural language querying"
git push origin main
```

## Demo Video Script

### 1. Introduction (30 seconds)
"Hi, this is my NLP Query Engine that allows users to upload CSV files and query them using natural language."

### 2. Upload Demo (30 seconds)
- Show the upload tab
- Drag and drop iris.csv file
- Show successful upload message
- Point out the database connection showing "Dynamic Database (iris)"

### 3. Query Demo (60 seconds)
- Switch to Query tab
- Show the sample queries
- Try: "Show all flowers where petal_width > 1"
- Show the generated SQL and results
- Try: "Count flowers by species"
- Show the grouping results

### 4. Features Highlight (30 seconds)
- Mention: "The system automatically generates SQL from natural language"
- Show different types of queries work
- Mention it works with any CSV file
- Show the clean, responsive interface

### 5. Conclusion (30 seconds)
"This demonstrates a complete full-stack application with React frontend, FastAPI backend, and intelligent natural language processing for database queries."

## Key Features to Highlight

✅ **Working Upload System** - Drag and drop CSV files
✅ **Smart Query Processing** - Natural language to SQL conversion  
✅ **Real-time Results** - Instant query execution
✅ **Clean Interface** - Professional React UI
✅ **Dynamic Schema** - Adapts to any CSV structure
✅ **Error Handling** - Robust error management
✅ **CORS Enabled** - Proper API integration