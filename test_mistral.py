import os
import asyncio
from dotenv import load_dotenv
from mistralai.client import Mistral

load_dotenv("backend/.env")

api_key = os.environ.get("MISTRAL_API_KEY")
client = Mistral(api_key=api_key)

def test_stream():
    chat_response = client.chat.stream(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": "hello"}]
    )
    for chunk in chat_response:
        print(f"data type: {type(chunk.data)}")
        print(f"content: '{chunk.data.choices[0].delta.content}'")
        break

if __name__ == "__main__":
    test_stream()
