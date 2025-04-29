from openai import OpenAI # type: ignore
from openai._exceptions import OpenAIError, RateLimitError # type: ignore
from pydantic import BaseModel, Field, ValidationError
import os
import json
import time
import random


class BoardGame(BaseModel):
    name: str

class Response(BaseModel):
    boardGame: BoardGame

class AIAPI:
    def __init__(self, api_key=None):
        # Use provided API key if available, otherwise fall back to environment variable
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            # Try to get from environment, with a fallback empty string to avoid errors
            env_api_key = os.environ.get('OPENAI_API_KEY', '')
            self.client = OpenAI(api_key=env_api_key)

    def getAPIResponse(self, gameImg, model = "gpt-4o-mini", max_retries=500, initial_backoff=1):
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": "1. You are given an image of a board game 2. Identify the board game"
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{gameImg}"
                        }
                    }
                ]
            }
        ]

        # Initialize retry counter and backoff time
        retries = 0
        backoff = initial_backoff

        while retries <= max_retries:
            try:
                completion = self.client.beta.chat.completions.parse(
                    model=model,
                    messages=messages,
                    response_format=Response
                )

                responseMessage = completion.choices[0].message
                if responseMessage.parsed:
                    return completion.choices[0].message.content
                # Refusal comes from not wanting to match the response format
                else:
                    print(f"Refused Response : \n{responseMessage.refusal}")
                    return None

            except RateLimitError as e:
                # Handle rate limit errors with exponential backoff
                retries += 1
                if retries > max_retries:
                    print(f"Maximum retries ({max_retries}) exceeded. Check OpenAI balance: {e}")
                    return None
                
                # Calculate backoff time with jitter to avoid thundering herd problem
                jitter = random.uniform(0, 0.1 * backoff)
                sleep_time = backoff + jitter
                
                print(f"Rate limit exceeded. Retrying in {sleep_time:.2f} seconds (attempt {retries}/{max_retries})...")
                time.sleep(sleep_time)
                
                # Exponential backoff: double the wait time for next attempt
                backoff *= 2
                
            except OpenAIError as e:
                # Handle other OpenAI errors
                print(f"OpenAI API error: {e}")
                return None
                
            except Exception as e:
                # Handle other potential errors
                print(f"An unexpected error occurred: {e}")
                return None

    def parse_api_response(self, json_str: str) -> Response:
        try:
            # Load JSON string into a Python dictionary
            data = json.loads(json_str)

            # Parse the dictionary into the ApiResponse model
            api_response = Response.model_validate(data)
            return api_response
        except ValidationError as e:
            print("Validation Error:", e)
            raise
