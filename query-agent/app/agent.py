from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain_community.utilities import SQLDatabase
from langchain_community.chat_models import ChatOllama

from app.database import get_connection_uri
from fastapi import HTTPException


def generate_sql_and_query(prompt: str, schema: dict):
    # Step 1: Get your Postgres connection URI
    uri = get_connection_uri()
    db = SQLDatabase.from_uri(uri)

    # Step 2: Build a detailed schema-aware system prompt
    system_prompt = f"""
You are a PostgreSQL expert with access to the following database schema:

{schema}

Please generate a valid SQL query to answer the following question:
"""

    # Step 3: Initialize the Ollama LLM with SAFE options (avoids `mirostat` errors)
    llm = ChatOllama(
        model="llama3",
        base_url="http://172.18.0.1:11434",  # Docker host IP for Ollama
        temperature=0.7,
        top_p=0.95,
        options={}
    )

    # Step 4: Create the SQL agent that will generate the query
    agent = create_sql_agent(
        llm=llm,
        toolkit=SQLDatabaseToolkit(db=db, llm=llm),
        verbose=True,
    )

    # Step 5: Try generating the query with error handling
    try:
        response = agent.invoke(f"{system_prompt} {prompt}")
        return {
            "query": f"{system_prompt} {prompt}",
            "response": response
        }
    except Exception as e:
        print("[Agent Error]", str(e))
        raise HTTPException(status_code=500, detail="Query agent failed to generate a response.")
