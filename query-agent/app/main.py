from fastapi import FastAPI, Request
from app.agent import generate_sql_and_query

app = FastAPI()

@app.post("/query")
async def query_data(req: Request):
    body = await req.json()
    user_prompt = body["prompt"]
    schema = body["schema"]
    return generate_sql_and_query(user_prompt, schema)