import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mistralai.client import Mistral
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CarbonTrack AI Assistant API")

# Setup CORS to allow requests from the React frontend
allowed_origins_str = os.environ.get("ALLOWED_ORIGINS")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.environ.get("MISTRAL_API_KEY")
client = Mistral(api_key=api_key) if api_key else None

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]
    
class ChatResponse(BaseModel):
    reply: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not client:
        # Mock response if API key is not configured
        def mock_generate():
            yield "[MOCK] I received your message. Please add your MISTRAL_API_KEY in .env to enable real AI."
        return StreamingResponse(mock_generate(), media_type="text/plain")

    try:
        api_messages = [
            {
                "role": "system",
                "content": "You are the CarbonTrack Sentinel Assistant, a helpful AI focused on sustainability, carbon tracking, and calculating emissions. Be concise and professional."
            }
        ]
        for msg in request.messages:
            api_messages.append({"role": msg.role, "content": msg.content})

        def generate():
            chat_response = client.chat.stream(
                model="mistral-small-latest",
                messages=api_messages
            )
            for chunk in chat_response:
                content = chunk.data.choices[0].delta.content
                if content:
                    yield content

        return StreamingResponse(generate(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "mistral_configured": bool(client)}
