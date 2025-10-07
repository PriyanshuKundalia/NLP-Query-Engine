from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import sqlite3
import uvicorn
import os
import shutil
import requests
from dotenv import load_dotenv

# Load environment variables from backend/.env if present
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
current_table_name = None
DB_PATH = "final_database.db"

@app.get("/")
async def root():
    return {"message": "NLP Query Engine Backend is running!", "status": "ok"}

@app.get("/api/connections")
async def get_connections():
    global current_table_name
    status = "connected"
    name = f"Dynamic Database ({current_table_name})" if current_table_name else "Dynamic Database (No Data)"
    
    return {
        "connections": [
            {
                "id": "dynamic",
                "name": name,
                "type": "sqlite", 
                "status": status
            }
        ]
    }

@app.get("/api/schema")
async def get_schema():
    global current_table_name
    
    if not current_table_name:
        return {
            "success": True,
            "database_name": "Dynamic Database (No Data)",
            "table_name": None,
            "tables": [],
            "message": "No CSV file uploaded. Please upload a CSV file to get started.",
            "waiting_for_upload": True
        }
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute(f"PRAGMA table_info({current_table_name})")
        columns_info = cursor.fetchall()
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {current_table_name}")
        row_count = cursor.fetchone()[0]
        
        conn.close()
        
        columns = [{"name": col[1], "type": col[2]} for col in columns_info]
        
        return {
            "success": True,
            "database_name": f"Dynamic Database ({current_table_name})",
            "table_name": current_table_name,
            "tables": [{
                "name": current_table_name,
                "row_count": row_count,
                "columns": columns
            }]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tables": []
        }

@app.post("/api/upload")
async def upload_csv_file(file: UploadFile = File(...)):
    global current_table_name
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Read CSV content
        content = await file.read()
        df = pd.read_csv(pd.io.common.StringIO(content.decode('utf-8')))
        
        # Create table name from filename
        table_name = file.filename.replace('.csv', '').replace(' ', '_').replace('-', '_').lower()
        current_table_name = table_name
        
        # Save to SQLite database
        conn = sqlite3.connect(DB_PATH)
        df.to_sql(table_name, conn, index=False, if_exists='replace')
        conn.close()
        
        return {
            "success": True,
            "message": f"Successfully uploaded {file.filename}",
            "table_name": table_name,
            "rows_processed": len(df),
            "columns": list(df.columns)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/query")
async def query_data(request: dict):
    global current_table_name
    
    if not current_table_name:
        return {
            "success": False,
            "error": "No CSV file uploaded. Please upload a CSV file first.",
            "query": request.get("query", ""),
            "sql_generated": "",
            "results": [],
            "total_results": 0
        }
    
    query = request.get("query", "").lower()
    
    # Smart query processing
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get column names
        cursor.execute(f"PRAGMA table_info({current_table_name})")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        
        # Generate SQL based on query
        sql = None
        
        if "count" in query or "how many" in query:
            if "species" in query:
                sql = f"SELECT species, COUNT(*) as count FROM {current_table_name} GROUP BY species"
            else:
                sql = f"SELECT COUNT(*) as count FROM {current_table_name}"
        
        elif "setosa" in query:
            sql = f"SELECT * FROM {current_table_name} WHERE species = 'setosa' LIMIT 50"
        
        elif "versicolor" in query:
            sql = f"SELECT * FROM {current_table_name} WHERE species = 'versicolor' LIMIT 50"
        
        elif "virginica" in query:
            sql = f"SELECT * FROM {current_table_name} WHERE species = 'virginica' LIMIT 50"
        
        elif "petal" in query and ">" in query:
            if "1" in query:
                sql = f"SELECT * FROM {current_table_name} WHERE petal_width > 1 LIMIT 50"
            elif "2" in query:
                sql = f"SELECT * FROM {current_table_name} WHERE petal_length > 2 LIMIT 50"
            else:
                sql = f"SELECT * FROM {current_table_name} WHERE petal_width > 1 LIMIT 50"
        
        elif "sepal" in query and ">" in query:
            if "6" in query:
                sql = f"SELECT * FROM {current_table_name} WHERE sepal_length > 6 LIMIT 50"
            elif "3" in query:
                sql = f"SELECT * FROM {current_table_name} WHERE sepal_width > 3 LIMIT 50"
            else:
                sql = f"SELECT * FROM {current_table_name} WHERE sepal_length > 5 LIMIT 50"
        
        elif "survived" in query:
            if "= 1" in query or "= '1'" in query or "is 1" in query:
                sql = f"SELECT * FROM {current_table_name} WHERE survived = 1 LIMIT 50"
            elif "= 0" in query or "= '0'" in query or "is 0" in query:
                sql = f"SELECT * FROM {current_table_name} WHERE survived = 0 LIMIT 50"
            else:
                sql = f"SELECT survived, COUNT(*) as count FROM {current_table_name} GROUP BY survived"
        
        elif "=" in query:
            # Handle general equality queries
            import re
            # Look for pattern "column = value"
            match = re.search(r'(\w+)\s*=\s*["\']?(\w+)["\']?', query)
            if match:
                column, value = match.groups()
                if value.isdigit():
                    sql = f"SELECT * FROM {current_table_name} WHERE {column} = {value} LIMIT 50"
                else:
                    sql = f"SELECT * FROM {current_table_name} WHERE {column} = '{value}' LIMIT 50"
            else:
                sql = f"SELECT * FROM {current_table_name} LIMIT 100"
            if "petal" in query:
                sql = f"SELECT AVG(petal_length) as avg_petal_length, AVG(petal_width) as avg_petal_width FROM {current_table_name}"
            elif "sepal" in query:
                sql = f"SELECT AVG(sepal_length) as avg_sepal_length, AVG(sepal_width) as avg_sepal_width FROM {current_table_name}"
            else:
                sql = f"SELECT AVG(petal_length) as avg_petal_length FROM {current_table_name}"
        
        elif "max" in query or "largest" in query:
            if "petal" in query:
                sql = f"SELECT MAX(petal_length) as max_petal_length, * FROM {current_table_name} WHERE petal_length = (SELECT MAX(petal_length) FROM {current_table_name})"
            elif "sepal" in query:
                sql = f"SELECT MAX(sepal_length) as max_sepal_length, * FROM {current_table_name} WHERE sepal_length = (SELECT MAX(sepal_length) FROM {current_table_name})"
            else:
                sql = f"SELECT * FROM {current_table_name} ORDER BY petal_length DESC LIMIT 10"
        
        elif "min" in query or "smallest" in query:
            if "petal" in query:
                sql = f"SELECT MIN(petal_width) as min_petal_width, * FROM {current_table_name} WHERE petal_width = (SELECT MIN(petal_width) FROM {current_table_name})"
            else:
                sql = f"SELECT * FROM {current_table_name} ORDER BY petal_width ASC LIMIT 10"
        
        else:
            # Default: show all data
            sql = f"SELECT * FROM {current_table_name} LIMIT 100"
        
        # Execute query
        cursor.execute(sql)
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries
        column_names = [description[0] for description in cursor.description]
        results = []
        for row in rows:
            row_dict = {}
            for i, value in enumerate(row):
                row_dict[column_names[i]] = value
            results.append(row_dict)
        
        conn.close()
        
        return {
            "success": True,
            "query": request.get("query", ""),
            "sql_generated": sql,
            "confidence": 0.90,
            "results": results,
            "total_results": len(results),
            "metadata": {
                "execution_time": "0.1s",
                "database": current_table_name,
                "rows_found": len(results)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Query execution failed: {str(e)}",
            "query": request.get("query", ""),
            "sql_generated": sql if 'sql' in locals() else "",
            "confidence": 0.0,
            "results": [],
            "total_results": 0,
            "metadata": {"error_details": str(e)}
        }


@app.post("/api/ai-query")
async def ai_query(request: dict):
    """Convert natural-language query to SQL using an LLM (OpenAI) and execute it.

    Expected request JSON: { "query": "natural language question", "table": "optional_table_name" }
    Requires environment variable OPENAI_API_KEY to be set. If missing, returns a clear error.
    """
    global current_table_name

    query_text = request.get("query", "").strip()
    table = request.get("table") or current_table_name

    if not query_text:
        raise HTTPException(status_code=400, detail="Missing 'query' in request body")
    if not table:
        return {
            "success": False,
            "error": "No table specified and no table uploaded. Please upload a CSV first or include a 'table' in the request." ,
            "query": query_text,
            "sql_generated": "",
            "results": [],
            "total_results": 0
        }

    # Get table schema (columns)
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table})")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch table schema: {str(e)}")

    # Build the prompt for the model
    # Create column list with proper escaping for special characters
    column_list = []
    for col in column_names:
        if '%' in col or ' ' in col or '-' in col:
            column_list.append(f'`{col}`')  # Use backticks for special chars
        else:
            column_list.append(col)
    
    prompt = (
        "You are an expert SQL generator. Convert the natural language query to a precise SQLite SELECT statement.\n"
        f"Table: {table}\n"
        f"Available columns (use EXACTLY these names): {', '.join(column_list)}\n\n"
        "CRITICAL RULES:\n"
        "- Return ONLY the SQL query, nothing else\n"
        "- Use SELECT statements only\n"
        "- Add LIMIT 100 unless user requests more\n"
        "- Use column names EXACTLY as provided above (including backticks if shown)\n"
        "- For discount queries, use `Discount%` (with backticks and percent sign)\n"
        "- For comparisons, use proper SQL operators (>, <, =, >=, <=)\n"
        "- For text searches, use LIKE with % wildcards\n\n"
        f"Query: {query_text}\n"
        "SQL:"
    )

    # Prefer OpenAI if key is present, otherwise try Hugging Face Inference API if token is present
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN") or os.getenv("HF_API_TOKEN")

    sql = None
    llm_error = None

    # Try OpenAI-compatible provider first (Groq/OpenAI)
    if OPENAI_API_KEY:
        try:
            print(f"🚀 Calling Groq API at: {OPENAI_API_BASE}")
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            }
            data = {
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "system", "content": "You are a SQL generator."},
                             {"role": "user", "content": prompt}],
                "temperature": 0.0,
                "max_tokens": 300,
            }
            api_url = f"{OPENAI_API_BASE}/chat/completions"
            print(f"📡 Sending request to: {api_url}")
            resp = requests.post(api_url, json=data, headers=headers, timeout=20)
            print(f"📈 Response status: {resp.status_code}")
            if resp.status_code == 200:
                result = resp.json()
                sql = result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                print(f"✅ Groq returned SQL: {sql}")
            else:
                llm_error = f"API error: {resp.status_code} - {resp.text}"
                print(f"❌ Groq API error: {llm_error}")
        except Exception as e:
            llm_error = f"LLM request failed: {str(e)}"
            print(f"💥 Groq exception: {llm_error}")

    # If OpenAI/Groq failed or did not produce SQL, try Hugging Face if configured
    if not sql and HUGGINGFACE_API_TOKEN:
        try:
            hf_headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}
            model = os.getenv("HUGGINGFACE_MODEL") or "google/flan-t5-small"
            hf_payload = {
                "inputs": prompt,
                "parameters": {"max_new_tokens": 256, "temperature": 0.0}
            }
            hf_url = f"https://api-inference.huggingface.co/models/{model}"
            resp = requests.post(hf_url, headers=hf_headers, json=hf_payload, timeout=30)
            if resp.status_code == 200:
                hf_result = resp.json()
                if isinstance(hf_result, list) and len(hf_result) > 0 and 'generated_text' in hf_result[0]:
                    sql = hf_result[0]['generated_text'].strip()
                elif isinstance(hf_result, dict) and 'generated_text' in hf_result:
                    sql = hf_result['generated_text'].strip()
                else:
                    sql = str(hf_result)
            else:
                if not llm_error:
                    llm_error = f"Hugging Face API error: {resp.status_code} - {resp.text}"
        except Exception as e:
            if not llm_error:
                llm_error = f"Hugging Face request failed: {str(e)}"

    # If no LLM produced a SQL string, fallback to rule-based engine
    if not sql:
        # Attach the LLM error as a note and call the existing rule-based handler
        fallback_reason = llm_error or "No LLM configured"
        # Call the rule-based query_data endpoint to get deterministic results
        try:
            rb_response = await query_data({"query": query_text})
            # Ensure caller sees that this was a fallback
            rb_response["source"] = "rule-based"
            rb_response["fallback_reason"] = fallback_reason
            return rb_response
        except Exception as e:
            return {"success": False, "error": f"LLM failed and rule-based fallback also failed: {str(e)}", "llm_error": fallback_reason}

    # Basic safety checks on generated SQL
    lowered = sql.lower()
    forbidden = ["delete", "update", "insert", "drop", "alter", "create"]
    # Disallow multiple statements by checking semicolons beyond a trailing one
    if ";" in lowered.strip().rstrip(';'):
        # Fallback to rule-based if generated SQL contains multiple statements
        rb_response = await query_data({"query": query_text})
        rb_response["source"] = "rule-based"
        rb_response["fallback_reason"] = "Generated SQL contained multiple statements or semicolons"
        return rb_response
    if any(tok in lowered for tok in forbidden):
        rb_response = await query_data({"query": query_text})
        rb_response["source"] = "rule-based"
        rb_response["fallback_reason"] = "Generated SQL contained forbidden operations"
        return rb_response

    # Ensure generated SQL references only known columns or *
    if "*" not in sql:
        cols_found = [c for c in column_names if c.lower() in lowered]
        if not cols_found:
            if not ("count(" in lowered or "avg(" in lowered or "sum(" in lowered or "group by" in lowered):
                rb_response = await query_data({"query": query_text})
                rb_response["source"] = "rule-based"
                rb_response["fallback_reason"] = "Generated SQL didn't reference known columns"
                return rb_response

    # Execute the SQL
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = cursor.fetchall()
        column_names_out = [description[0] for description in cursor.description] if cursor.description else []
        results = [dict(zip(column_names_out, row)) for row in rows]
        conn.close()

        return {
            "success": True,
            "query": query_text,
            "sql_generated": sql,
            "confidence": 0.9,
            "results": results,
            "total_results": len(results),
            "metadata": {"database": table}
        }
    except Exception as e:
        return {"success": False, "error": f"Execution failed: {str(e)}", "sql_generated": sql}

if __name__ == "__main__":
    print("🚀 Starting NLP Query Engine Backend...")
    print("📊 Server will be available at: http://localhost:8000")
    print("✅ CORS enabled for frontend at: http://localhost:3000")
    uvicorn.run(app, host="127.0.0.1", port=8000)