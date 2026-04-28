import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("Warning: GEMINI_API_KEY not found in environment.")

model = genai.GenerativeModel('gemini-2.5-flash')

def extract_needs_from_text(description: str):
    """
    Feature 1: Extracts structured data from raw community need reports.
    """
    prompt = f"""
    You are a high-precision crisis response coordinator for CommunityPulse. Your task is to translate and structure raw field reports from any language into actionable relief data.
    
    Input Report: "{description}"

    Guidelines:
    1. Language: Always provide the summary and key_needs in English, regardless of the input language.
    2. Urgency: 
       - Be conservative. If the report is vague ("things are bad"), assign a moderate score (3.0-5.0).
       - Only assign 9.0+ if there is explicit mention of lack of food/water for 48h+, medical emergencies, or life-threats.
    3. Multi-Needs: If multiple needs exist, select the most life-critical category (Medical > Food > Shelter > Debris).
    4. Affected Count: Return the total number of INDIVIDUALS. If families are mentioned, estimate 5 people per family.

    Return ONLY a JSON object:
    - category: one of [food, medical, shelter, education, debris, other]
    - urgency_score: float from 0.0 to 10.0
    - affected_count: integer or null
    - summary: (exactly 2-sentence summary)
    - key_needs: (array of 2-3 specific action items)
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean response text in case Gemini adds markdown backticks
        clean_json = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(clean_json)
    except Exception as e:
        print(f"Gemini Error: {e}")
        # Fallback if AI fails or key is missing
        return {
            "category": "other",
            "urgency_score": 5.0,
            "affected_count": 0,
            "summary": "Report received and pending manual review. AI extraction failed or was bypassed.",
            "key_needs": ["Review report details", "Contact field reporter"]
        }

async def suggest_task_fields(category: str, summary: str, scale: int, location: str):
    """
    Feature 2: Suggests task details for NGO admins.
    """
    prompt = f"""
    Based on the following community need report, suggest details for a volunteer task.
    
    Category: {category}
    Summary: {summary}
    Scale: {scale} people affected
    Location: {location}

    Return ONLY a JSON object with these fields:
    - title: (Clear, action-oriented title)
    - skills: (List of 3 relevant skill tags)
    - volunteer_count: (Suggested number of volunteers based on scale)
    - briefing: (A short instructional briefing for volunteers)

    Example Output:
    {{"title": "Food Distribution - Wadgaon Sheri", "skills": ["Logistics", "Physical Fitness"], "volunteer_count": 10, "briefing": "Help distribute food kits..."}}
    """
    
    try:
        response = model.generate_content(prompt)
        clean_json = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(clean_json)
    except Exception as e:
        print(f"Gemini Error: {e}")
        return {
            "title": f"Relief Operation: {category}",
            "skills": ["General Volunteering"],
            "volunteer_count": 5,
            "briefing": "Coordinate with the local NGO admin on arrival."
        }
