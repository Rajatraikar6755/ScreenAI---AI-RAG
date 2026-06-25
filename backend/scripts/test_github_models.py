import os
from openai import OpenAI

token = "YOUR_GITHUB_TOKEN"
client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=token,
)

for target_model in ["gpt-4o", "gpt-4", "gpt-3.5-turbo"]:
    print(f"Testing completion with {target_model}...")
    try:
        response = client.chat.completions.create(
            model=target_model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Return exactly: {'status': 'success'}"}
            ],
            temperature=0.1
        )
        print(f"Success! Response: {response.choices[0].message.content}")
        break
    except Exception as e:
        print(f"Failed: {e}")
