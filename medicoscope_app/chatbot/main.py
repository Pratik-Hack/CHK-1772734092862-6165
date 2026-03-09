import os
import json
import uuid
import asyncio
import tempfile
import math
import random
from datetime import datetime, timezone, timedelta
from typing import Optional  # noqa: F401

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import anthropic

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

load_dotenv()

# ── Groq client for Whisper + direct completions ────────────────────────────

groq_client = None
if os.environ.get("GROQ_API_KEY"):
    groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])

# ── Anthropic client for synthetic vitals data agent ────────────────────────

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")

anthropic_client = None
if ANTHROPIC_API_KEY:
    anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# ── Mental Health Notification Store (in-memory) ────────────────────────────

mental_health_notifications: list[dict] = []

# ── Vitals Monitoring Store (in-memory) ─────────────────────────────────────

vitals_sessions: dict[str, dict] = {}   # session_id -> session data
vitals_alerts: list[dict] = []           # alerts for doctors/emergency contacts

# ── Medical Knowledge Base ──────────────────────────────────────────────────

MEDICAL_DATA = {
    "diseases_detailed": {
        "skin": [
            {
                "name": "Actinic Keratoses",
                "category": "skin",
                "severity": {"level": "precancerous", "progression_risk": "can develop into squamous cell carcinoma if untreated"},
                "symptoms": {
                    "early": ["small rough patches on skin", "dry scaly texture more felt than seen", "mild discoloration (pink, red, brown)"],
                    "progressive": ["thickened scaly plaques", "itching or burning sensation", "visible redness with inflammation"],
                    "advanced": ["bleeding lesions", "rapid growth or hardening", "ulceration (possible malignant transformation)"]
                },
                "red_flags": ["lesion bleeding without injury", "rapid increase in size", "painful hard lesion"],
                "causes": ["chronic ultraviolet (UV) exposure"],
                "risk_factors": ["fair skin", "long-term sun exposure", "outdoor occupation", "age > 40"],
                "chatbot_triggers": ["rough patch", "dry skin spot", "sun damage", "itchy scaly patch"],
                "follow_up_questions": ["How long has the patch been present?", "Is it growing or changing?", "Do you spend a lot of time in sunlight?", "Does it bleed or hurt?"],
                "severity_assessment_logic": {"low": "small stable patch, no pain", "moderate": "multiple lesions or itching", "high": "bleeding, rapid growth, pain"},
                "remedies": {
                    "home_care": ["daily sunscreen SPF 30+", "avoid peak sunlight (10am-4pm)", "wear protective clothing"],
                    "medical": ["cryotherapy", "topical 5-FU or imiquimod", "laser or photodynamic therapy"]
                },
                "prevention": ["consistent sunscreen use", "avoid tanning", "regular skin checks"],
                "differential_hints": ["unlike eczema, lesions are persistent and localized", "unlike psoriasis, not widespread"]
            },
            {
                "name": "Melanoma",
                "category": "skin",
                "severity": {"level": "high", "progression_risk": "high metastatic potential"},
                "symptoms": {
                    "early": ["new mole or change in existing mole", "asymmetry in shape", "uneven color"],
                    "progressive": ["irregular borders", "increase in diameter (>6mm)", "color variation (black, brown, red, white)"],
                    "advanced": ["bleeding mole", "ulceration", "itching or pain", "satellite lesions nearby"]
                },
                "red_flags": ["rapid change in mole", "bleeding without injury", "multiple colors in lesion"],
                "chatbot_triggers": ["changing mole", "black spot growing", "irregular mole"],
                "follow_up_questions": ["Has the mole changed in size or color?", "Does it itch or bleed?", "How long has it been present?", "Any family history of skin cancer?"],
                "severity_assessment_logic": {"low": "stable mole", "moderate": "changing features", "high": "bleeding, rapid evolution"},
                "remedies": {
                    "home_care": ["no home treatment recommended"],
                    "medical": ["urgent dermatology consultation", "biopsy", "surgical removal", "immunotherapy (advanced)"]
                },
                "prevention": ["avoid UV exposure", "monthly mole self-check (ABCDE rule)"],
                "differential_hints": ["unlike benign nevi, shows evolution over time"]
            },
            {
                "name": "Basal Cell Carcinoma",
                "category": "skin",
                "severity": {"level": "moderate", "progression_risk": "rarely metastasizes but can cause local tissue damage"},
                "symptoms": {
                    "early": ["pearly or waxy bump", "flat flesh-colored lesion", "small blood vessels visible"],
                    "progressive": ["lesion grows slowly", "may bleed easily", "scar-like appearance"],
                    "advanced": ["ulceration", "invasion of deeper tissues", "disfigurement"]
                },
                "red_flags": ["non-healing sore", "bleeding bump", "growing lesion on sun-exposed area"],
                "chatbot_triggers": ["pearly bump", "non-healing sore", "waxy skin growth"],
                "follow_up_questions": ["How long has the lesion been present?", "Does it bleed or crust over?", "Is it on a sun-exposed area?"],
                "severity_assessment_logic": {"low": "small stable lesion", "moderate": "growing or bleeding", "high": "large, ulcerated"},
                "remedies": {
                    "home_care": ["sun protection", "monitor for changes"],
                    "medical": ["surgical excision", "Mohs surgery", "cryotherapy", "topical treatments"]
                },
                "prevention": ["sunscreen", "avoid prolonged sun exposure", "regular dermatology visits"],
                "differential_hints": ["unlike melanoma, usually flesh-colored or pearly, not darkly pigmented"]
            },
            {
                "name": "Vascular Lesions",
                "category": "skin",
                "severity": {"level": "low_to_moderate", "progression_risk": "most are benign"},
                "symptoms": {
                    "early": ["red, purple, or blue marks on skin", "flat or slightly raised"],
                    "progressive": ["may increase in size", "can become raised", "color deepening"],
                    "advanced": ["bleeding if traumatized", "ulceration in rare cases"]
                },
                "red_flags": ["rapid growth", "bleeding", "pain"],
                "chatbot_triggers": ["red spot on skin", "purple mark", "blood vessel growth"],
                "follow_up_questions": ["When did you first notice it?", "Has it changed in size?", "Does it bleed?"],
                "severity_assessment_logic": {"low": "stable, small", "moderate": "growing", "high": "bleeding, painful"},
                "remedies": {
                    "home_care": ["monitor for changes", "protect from trauma"],
                    "medical": ["laser therapy", "sclerotherapy", "surgical removal if needed"]
                },
                "prevention": ["no specific prevention"],
                "differential_hints": ["unlike bruises, these are persistent and don't fade over days"]
            }
        ],
        "chest": [
            {
                "name": "Pneumonia",
                "category": "chest",
                "severity": {"level": "moderate_to_high", "progression_risk": "can lead to respiratory failure if untreated"},
                "symptoms": {
                    "early": ["mild fever", "dry cough", "fatigue"],
                    "progressive": ["productive cough with phlegm", "high fever", "chest pain during breathing", "shortness of breath"],
                    "advanced": ["confusion (especially elderly)", "low oxygen levels", "bluish lips (cyanosis)"]
                },
                "red_flags": ["difficulty breathing", "oxygen saturation < 92%", "persistent high fever"],
                "chatbot_triggers": ["cough with fever", "chest pain when breathing", "phlegm cough"],
                "follow_up_questions": ["Do you have fever and cough together?", "Is the cough producing mucus?", "Are you feeling breathless?", "Any recent infection or travel?"],
                "severity_assessment_logic": {"low": "mild cough, low fever", "moderate": "productive cough + fever", "high": "breathlessness, confusion"},
                "remedies": {
                    "home_care": ["rest", "hydration", "steam inhalation"],
                    "medical": ["antibiotics (if bacterial)", "antivirals (if viral)", "oxygen therapy (severe cases)"]
                },
                "prevention": ["vaccination (flu, pneumococcal)", "good hygiene", "avoid smoking"],
                "differential_hints": ["unlike common cold, involves chest pain and breathing difficulty"]
            },
            {
                "name": "Pneumothorax",
                "category": "chest",
                "severity": {"level": "emergency", "progression_risk": "life-threatening if untreated"},
                "symptoms": {
                    "early": ["sudden chest discomfort"],
                    "progressive": ["sharp chest pain", "shortness of breath"],
                    "advanced": ["rapid heart rate", "severe breathing distress", "collapse (in tension pneumothorax)"]
                },
                "red_flags": ["sudden severe chest pain", "difficulty breathing", "fainting"],
                "chatbot_triggers": ["sudden chest pain", "can't breathe properly"],
                "follow_up_questions": ["Did the pain start suddenly?", "Are you struggling to breathe?", "Any recent injury or trauma?"],
                "severity_assessment_logic": {"low": "mild symptoms", "moderate": "pain + breathlessness", "high": "severe distress"},
                "remedies": {
                    "home_care": ["none - seek emergency care immediately"],
                    "medical": ["IMMEDIATE emergency care", "needle decompression", "chest tube insertion"]
                },
                "prevention": ["avoid smoking", "manage lung disease"],
                "differential_hints": ["unlike heart attack, often linked with breathing asymmetry"]
            },
            {
                "name": "Cardiomegaly",
                "category": "chest",
                "severity": {"level": "moderate_to_high", "progression_risk": "indicates underlying cardiovascular disease"},
                "symptoms": {
                    "early": ["fatigue", "mild shortness of breath during exertion"],
                    "progressive": ["swelling in legs/ankles", "irregular heartbeat", "shortness of breath at rest"],
                    "advanced": ["severe fluid retention", "chest pain", "fainting episodes"]
                },
                "red_flags": ["chest pain", "severe shortness of breath", "fainting"],
                "chatbot_triggers": ["enlarged heart", "heart swelling", "shortness of breath with swelling"],
                "follow_up_questions": ["Do you experience shortness of breath?", "Any swelling in your legs?", "Do you have a history of heart disease?"],
                "severity_assessment_logic": {"low": "mild fatigue", "moderate": "shortness of breath + swelling", "high": "chest pain, fainting"},
                "remedies": {
                    "home_care": ["reduce salt intake", "regular gentle exercise", "monitor weight"],
                    "medical": ["medications (ACE inhibitors, diuretics)", "treat underlying cause", "regular cardiology follow-up"]
                },
                "prevention": ["heart-healthy diet", "regular exercise", "manage blood pressure"],
                "differential_hints": ["unlike simple fatigue, involves progressive cardiac symptoms"]
            }
        ],
        "brain": [
            {
                "name": "Tumor-Cell (Glioma)",
                "category": "brain",
                "severity": {"level": "critical", "progression_risk": "progressive neurological damage"},
                "symptoms": {
                    "early": ["persistent headaches", "mild memory issues", "subtle personality changes"],
                    "progressive": ["seizures", "vision problems", "speech difficulty", "weakness in one side of body"],
                    "advanced": ["severe neurological deficits", "loss of consciousness", "uncontrolled seizures"]
                },
                "red_flags": ["new onset seizures", "progressive neurological decline", "persistent vomiting with headache"],
                "chatbot_triggers": ["seizure", "brain tumor symptoms", "constant headache", "vision + headache"],
                "follow_up_questions": ["Are headaches worsening over time?", "Have you experienced seizures?", "Any vision or speech issues?", "Any weakness in body?"],
                "severity_assessment_logic": {"low": "mild headache", "moderate": "neurological symptoms", "high": "seizures, deficits"},
                "remedies": {
                    "home_care": [],
                    "medical": ["Consult your doctor as soon as possible", "neurosurgery evaluation", "radiation therapy", "chemotherapy"]
                },
                "prevention": ["no clear prevention"],
                "differential_hints": ["unlike migraine, symptoms progressively worsen and include neurological deficits"]
            }
        ]
    },
    "chatbot_logic": {
        "triage_rules": {
            "emergency": ["difficulty breathing", "loss of consciousness", "seizures", "severe chest pain"],
            "urgent": ["persistent fever", "bleeding lesions", "neurological symptoms"],
            "non_urgent": ["mild stable symptoms"]
        },
        "response_templates": {
            "emergency": "This may be serious. Please seek immediate medical attention.",
            "urgent": "You should consult a doctor soon.",
            "non_urgent": "This may not be serious, but monitor symptoms."
        }
    }
}

# ── Build medical context once at import time ────────────────────────────────

def _build_medical_context():
    """Flatten all disease data into a single text block for the LLM prompt."""
    sections = []
    for category, diseases in MEDICAL_DATA["diseases_detailed"].items():
        for disease in diseases:
            lines = [
                f"Disease Name: {disease['name']}",
                f"Category: {category}",
                f"Severity Level: {disease['severity']['level']}",
                f"Early Symptoms: {', '.join(disease['symptoms']['early'])}",
                f"Progressive Symptoms: {', '.join(disease['symptoms']['progressive'])}",
                f"Advanced Symptoms: {', '.join(disease['symptoms']['advanced'])}",
                f"Red Flags: {', '.join(disease['red_flags'])}",
                f"Follow-up Questions to Ask User: {', '.join(disease['follow_up_questions'])}",
                f"Home Remedies: {', '.join(disease['remedies']['home_care']) or 'None'}",
                f"Medical Remedies: {', '.join(disease['remedies']['medical'])}",
            ]
            sections.append("\n".join(lines))
    return "\n\n---\n\n".join(sections)

MEDICAL_CONTEXT = _build_medical_context()
TRIAGE_LOGIC = json.dumps(MEDICAL_DATA["chatbot_logic"], indent=2, ensure_ascii=False)

# ── Language Instructions ─────────────────────────────────────────────────────

LANGUAGE_INSTRUCTIONS = {
    "en": "",
    "hi": "IMPORTANT: You MUST respond entirely in Hindi (हिन्दी). Use Devanagari script.",
    "ta": "IMPORTANT: You MUST respond entirely in Tamil (தமிழ்). Use Tamil script.",
    "te": "IMPORTANT: You MUST respond entirely in Telugu (తెలుగు). Use Telugu script.",
    "mr": "IMPORTANT: You MUST respond entirely in Marathi (मराठी). Use Devanagari script.",
    "bn": "IMPORTANT: You MUST respond entirely in Bengali (বাংলা). Use Bengali script.",
    "kn": "IMPORTANT: You MUST respond entirely in Kannada (ಕನ್ನಡ). Use Kannada script.",
}

# ── Globals ──────────────────────────────────────────────────────────────────

conversational_chain = None
session_store = {}

SYSTEM_TEMPLATE = """
{language_instruction}
You are a highly capable, conversational medical triage assistant for MedicoScope.
You have been provided with the user's patient profile, a set of global Triage Rules, and specific medical context.

CRITICAL OUTPUT RULES:
- DO NOT output your internal thought process.
- DO NOT print phrases like "CHECK TRIAGE RULES" or "CHECK MEDICAL CONTEXT".
- Speak directly, naturally, and empathetically to the user.
- Keep responses concise (2-4 paragraphs max) since this is a mobile chat interface.

INTERNAL LOGIC TO FOLLOW:
1. EMERGENCY/URGENT CHECK: If the user's symptoms match the 'emergency' or 'urgent' lists in the Triage Rules, you MUST start your response with the exact Response Template provided in the rules.
2. CONTEXT MATCH: If the symptoms match a disease in the Retrieved Medical Context, tell them the potential condition, list the home/medical remedies, and ask 1 or 2 of the specific "Follow-up Questions" to gather more information.
3. MINOR UNKNOWN SYMPTOMS: If symptoms are NOT in the context, but are clearly minor everyday ailments (e.g., slight cold, mild headache), provide safe, generic home remedies.
4. SERIOUS UNKNOWN SYMPTOMS: If symptoms are NOT in the context and involve sharp pain, shooting pain, high fever, trauma, or anything potentially severe, you MUST refuse to diagnose. Respond EXACTLY with: "I do not have enough information in my database to evaluate these symptoms safely. Please consult a healthcare professional."
5. SAFETY OVERRIDE: Always tailor advice to the Patient Profile. Never suggest a remedy that conflicts with their current diseases.
6. GREETING: If the user greets you or says hello, respond warmly, introduce yourself as their MedicoScope medical assistant, and ask how you can help with their health today.

Patient Profile:
{patient_profile}

Global Triage Rules & Response Templates:
{triage_logic}

Retrieved Medical Context:
{context}
"""


def get_session_history(session_id: str):
    if session_id not in session_store:
        session_store[session_id] = InMemoryChatMessageHistory()
    return session_store[session_id]


def initialize_chatbot():
    global conversational_chain

    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        print("WARNING: GROQ_API_KEY not set. Chatbot will not function.")
        return

    print("Initializing Groq LLM (Llama 3.1 8B)...")
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.3,
        max_tokens=512,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_TEMPLATE),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{question}"),
    ])

    # Simple chain: inject static context + language (preserve history from RunnableWithMessageHistory)
    chain = (
        RunnablePassthrough.assign(
            context=lambda _: MEDICAL_CONTEXT,
            triage_logic=lambda _: TRIAGE_LOGIC,
            language_instruction=lambda x: LANGUAGE_INSTRUCTIONS.get(x.get("language", "en"), ""),
        )
        | prompt
        | llm
        | StrOutputParser()
    )

    conversational_chain = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="question",
        history_messages_key="history",
    )

    print("Chatbot initialized successfully!")


# ── FastAPI App ─────────────────────────────────────────────────────────────

app = FastAPI(title="MedicoScope Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize immediately — no heavy model downloads, just a Groq API key check
initialize_chatbot()


class ChatRequest(BaseModel):
    message: str
    session_id: str
    patient_profile: str = "No patient profile provided."
    language: str = "en"


class ChatResponse(BaseModel):
    response: str
    session_id: str


@app.get("/health")
def health():
    return {"status": "ok", "ready": conversational_chain is not None, "service": "medicoscope-chatbot"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if conversational_chain is None:
        raise HTTPException(status_code=503, detail="Chatbot not initialized. Check GROQ_API_KEY.")

    try:
        response = await conversational_chain.ainvoke(
            {
                "question": request.message,
                "patient_profile": request.patient_profile,
                "language": request.language,
            },
            config={"configurable": {"session_id": request.session_id}},
        )
        return ChatResponse(response=response, session_id=request.session_id)
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint — returns Server-Sent Events with token chunks."""
    if conversational_chain is None:
        raise HTTPException(status_code=503, detail="Chatbot not initialized. Check GROQ_API_KEY.")

    async def event_generator():
        try:
            async for chunk in conversational_chain.astream(
                {
                    "question": request.message,
                    "patient_profile": request.patient_profile,
                    "language": request.language,
                },
                config={"configurable": {"session_id": request.session_id}},
            ):
                if chunk:
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# ── Mental Health Voice Analysis ────────────────────────────────────────────

COINS_PER_SESSION = 10

@app.post("/mental-health/analyze")
async def analyze_mental_health(
    audio: UploadFile = File(...),
    patient_id: str = Form(...),
    patient_name: str = Form(...),
    doctor_id: str = Form(""),
):
    if groq_client is None:
        raise HTTPException(status_code=503, detail="Service not initialized.")

    # Save uploaded audio to a temp file
    suffix = os.path.splitext(audio.filename or "audio.m4a")[1] or ".m4a"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Step 1: Transcribe audio via Groq Whisper
        print(f"Transcribing audio for patient {patient_id}...")
        with open(tmp_path, "rb") as f:
            transcription = groq_client.audio.transcriptions.create(
                file=(audio.filename or "audio.m4a", f.read()),
                model="whisper-large-v3",
            )
        transcript = transcription.text
        print(f"Transcript: {transcript[:100]}...")

        if not transcript.strip():
            return {"user_message": "I couldn't hear anything clearly. Could you try speaking again?", "coins_earned": 0}

        # Step 2 & 3: Generate BOTH responses in parallel for speed
        user_messages = [
            {
                "role": "system",
                "content": (
                    "You are an empathetic, supportive, and kind mental health companion for MedicoScope. "
                    "Respond directly to the user based on their audio transcript. "
                    "1. Validate their feelings warmly. "
                    "2. Offer a brief, comforting thought. "
                    "3. Suggest a gentle, immediate coping mechanism (like taking a deep breath). "
                    "4. DO NOT diagnose them. DO NOT sound clinical. Speak like a caring friend. "
                    "5. Keep it concise (2-3 short paragraphs) for a mobile chat interface. "
                    "6. If the user is just sharing their daily routine casually, respond warmly and "
                    "encourage them to keep sharing. Appreciate their openness."
                ),
            },
            {"role": "user", "content": f"User said: {transcript}"},
        ]

        doctor_messages = [
            {
                "role": "system",
                "content": (
                    "You are a strictly clinical NLP Medical Scribe. "
                    "Analyze the patient's transcript and provide a structured, objective report.\n\n"
                    f"The patient's name is {patient_name}. Use their actual name in the report "
                    "since this report is only visible to their treating doctor.\n\n"
                    "Format:\n"
                    f"PATIENT PRESENTATION: (Brief summary referencing {patient_name})\n"
                    "PRIMARY EMOTION MARKERS: (e.g., Anxiety, Depression, Grief, Stress, Normal)\n"
                    "IDENTIFIED STRESSORS: (Specific issues mentioned)\n"
                    "URGENCY LEVEL: (Low / Medium / High — based on self-harm or severe distress markers)\n"
                    "RECOMMENDED ACTIONS: (What the doctor should consider)\n\n"
                    "Keep the tone clinical and professional. If the transcript is mundane/casual, "
                    "report URGENCY LEVEL: Low and note normal mental state."
                ),
            },
            {"role": "user", "content": f"Patient Transcript: {transcript}"},
        ]

        # Run both LLM calls in parallel using asyncio
        user_future = asyncio.to_thread(
            groq_client.chat.completions.create,
            messages=user_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            max_tokens=512,
        )
        doctor_future = asyncio.to_thread(
            groq_client.chat.completions.create,
            messages=doctor_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=512,
        )

        user_completion, doctor_completion = await asyncio.gather(user_future, doctor_future)
        user_message = user_completion.choices[0].message.content
        doctor_report = doctor_completion.choices[0].message.content

        # Extract urgency from the report
        urgency = "Low"
        report_lower = doctor_report.lower()
        if "urgency level: high" in report_lower or "urgency: high" in report_lower:
            urgency = "High"
        elif "urgency level: medium" in report_lower or "urgency: medium" in report_lower:
            urgency = "Medium"

        # Step 4: Store notification for doctor (patient NEVER sees this)
        if doctor_id:
            notification = {
                "id": str(uuid.uuid4()),
                "doctor_id": doctor_id,
                "patient_id": patient_id,
                "patient_name": patient_name,
                "report": doctor_report,
                "urgency": urgency,
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            mental_health_notifications.append(notification)
            print(f"Stored notification for doctor {doctor_id} (urgency: {urgency})")

        return {"user_message": user_message, "coins_earned": COINS_PER_SESSION}

    finally:
        os.unlink(tmp_path)


@app.get("/mental-health/notifications/{doctor_id}")
def get_notifications(doctor_id: str):
    notes = [n for n in mental_health_notifications if n["doctor_id"] == doctor_id]
    notes.sort(key=lambda x: x["created_at"], reverse=True)
    return {"notifications": notes}


@app.put("/mental-health/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    for n in mental_health_notifications:
        if n["id"] == notification_id:
            n["read"] = True
            return {"status": "ok"}
    raise HTTPException(status_code=404, detail="Notification not found")


# ── Rewards Endpoints ───────────────────────────────────────────────────────

class RewardRequest(BaseModel):
    reward_type: str  # meditation, wellness_report, health_tips
    patient_name: str = "User"


@app.post("/rewards/redeem")
async def redeem_reward(request: RewardRequest):
    if groq_client is None:
        raise HTTPException(status_code=503, detail="Service not initialized.")

    prompts = {
        "meditation": (
            f"Create a personalized 5-minute guided meditation script for {request.patient_name}. "
            "Structure it with:\n"
            "1. OPENING (30 seconds) — gentle greeting, invite to close eyes\n"
            "2. BREATHING EXERCISE (1 minute) — box breathing or 4-7-8 technique\n"
            "3. BODY SCAN (1.5 minutes) — progressive relaxation from head to toes\n"
            "4. VISUALIZATION (1.5 minutes) — peaceful nature scene\n"
            "5. CLOSING (30 seconds) — gentle return to awareness\n\n"
            "Write in second person ('you'), use calming language. "
            "Include pauses marked as [pause 5s], [pause 10s]. Keep it warm and soothing."
        ),
        "wellness_report": (
            f"Generate a Weekly Mental Wellness Report for {request.patient_name}. "
            "Create a realistic, helpful report with:\n\n"
            "WEEKLY WELLNESS SUMMARY\n"
            "- Overall Mood Trend: (e.g., Gradually Improving / Stable / Needs Attention)\n"
            "- Emotional Resilience Score: (out of 10, with brief explanation)\n"
            "- Key Patterns Noticed: (2-3 bullet points about mood patterns)\n\n"
            "PERSONALIZED RECOMMENDATIONS\n"
            "- 3 specific, actionable wellness activities tailored to their patterns\n"
            "- 1 mindfulness technique to try this week\n"
            "- 1 social connection suggestion\n\n"
            "PROGRESS HIGHLIGHTS\n"
            "- Acknowledge consistency in check-ins\n"
            "- Note positive behaviors observed\n\n"
            "Keep the tone professional but encouraging. End with a motivational note."
        ),
        "health_tips": (
            f"Generate a Premium Health & Wellness Guide for {request.patient_name}. "
            "Provide evidence-based content organized as:\n\n"
            "MENTAL HEALTH TOOLKIT\n"
            "- 3 breathing exercises with step-by-step instructions\n"
            "- 2 grounding techniques for anxiety (5-4-3-2-1 method, etc.)\n"
            "- 1 journaling prompt for self-reflection\n\n"
            "DAILY WELLNESS HABITS\n"
            "- Morning routine suggestion (5 minutes)\n"
            "- Midday stress-relief technique\n"
            "- Evening wind-down ritual\n\n"
            "NUTRITION FOR MENTAL HEALTH\n"
            "- 3 mood-boosting foods and why they help\n"
            "- Hydration reminder with tips\n\n"
            "SLEEP OPTIMIZATION\n"
            "- 3 sleep hygiene tips\n"
            "- A simple bedtime relaxation technique\n\n"
            "Keep it practical, actionable, and warm. Use bullet points for readability."
        ),
    }

    prompt = prompts.get(request.reward_type)
    if not prompt:
        raise HTTPException(status_code=400, detail=f"Unknown reward type: {request.reward_type}")

    try:
        completion = await asyncio.to_thread(
            groq_client.chat.completions.create,
            messages=[
                {"role": "system", "content": "You are a certified wellness coach and mental health expert. Provide helpful, evidence-based content that is practical and actionable."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1500,
        )
        content = completion.choices[0].message.content
        return {"content": content, "reward_type": request.reward_type}
    except Exception as e:
        print(f"Reward generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate reward content.")


# ── Vitals Monitoring Endpoints ────────────────────────────────────────────

class VitalsStartRequest(BaseModel):
    patient_id: str
    patient_name: str
    doctor_id: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    location: str = "Unknown"
    latitude: float = 0.0
    longitude: float = 0.0


class VitalsTickRequest(BaseModel):
    session_id: str


def _generate_synthetic_batch(session: dict, count: int = 10) -> list[dict]:
    """Generate synthetic vitals data points using physiological models.
    Includes aggressive trend shifts that lead to anomalies — enabling
    PREVENTIVE alerts before the actual spike occurs."""

    data_points = []
    idx = session.get("tick_index", 0)
    base_hr = session.get("base_hr", 72)
    base_sys = session.get("base_sys", 120)
    base_dia = session.get("base_dia", 80)
    base_spo2 = session.get("base_spo2", 97.5)
    anomaly_events = session.get("anomaly_events", [])

    for i in range(count):
        t = idx + i

        # Breathing cycle effect — small natural variation
        breathing = math.sin(t * 0.15) * 1.5

        # Random physiological noise
        noise_hr = random.gauss(0, 1.0)
        noise_bp = random.gauss(0, 0.8)
        noise_spo2 = random.gauss(0, 0.1)

        # Aggregate trends from ALL anomaly events
        trend_hr = 0
        trend_sys = 0
        trend_dia = 0
        trend_spo2 = 0

        for event in anomaly_events:
            onset = event.get("onset_tick", 999)
            peak = event.get("peak_tick", 999)
            atype = event.get("type", "tachycardia")
            intensity = event.get("intensity", 1.0)

            if onset <= t <= peak:
                progress = (t - onset) / max(peak - onset, 1)
                # Use exponential curve for more dramatic ramp-up
                progress = progress ** 1.5
                if atype == "tachycardia":
                    trend_hr += progress * 70 * intensity
                    trend_spo2 -= progress * 3 * intensity
                elif atype == "hypotension":
                    trend_sys -= progress * 45 * intensity
                    trend_dia -= progress * 25 * intensity
                    trend_hr += progress * 25 * intensity
                elif atype == "hypoxia":
                    trend_spo2 -= progress * 10 * intensity
                    trend_hr += progress * 30 * intensity
                elif atype == "hypertension":
                    trend_sys += progress * 55 * intensity
                    trend_dia += progress * 30 * intensity
                    trend_hr += progress * 15 * intensity
            elif t > peak:
                # Recovery phase — faster recovery
                recovery_progress = min((t - peak) / 20, 1.0)
                rp = 1 - recovery_progress
                if atype == "tachycardia":
                    trend_hr += 70 * intensity * rp
                    trend_spo2 -= 3 * intensity * rp
                elif atype == "hypotension":
                    trend_sys -= 45 * intensity * rp
                    trend_dia -= 25 * intensity * rp
                    trend_hr += 25 * intensity * rp
                elif atype == "hypoxia":
                    trend_spo2 -= 10 * intensity * rp
                    trend_hr += 30 * intensity * rp
                elif atype == "hypertension":
                    trend_sys += 55 * intensity * rp
                    trend_dia += 30 * intensity * rp
                    trend_hr += 15 * intensity * rp

        hr = round(base_hr + breathing + noise_hr + trend_hr, 1)
        systolic = round(base_sys + noise_bp + trend_sys, 1)
        diastolic = round(base_dia + noise_bp * 0.5 + trend_dia, 1)
        spo2 = round(min(100, base_spo2 + noise_spo2 + trend_spo2), 1)

        # Clamp to physiological bounds
        hr = max(40, min(190, hr))
        systolic = max(60, min(220, systolic))
        diastolic = max(35, min(140, diastolic))
        spo2 = max(82, min(100, spo2))

        timestamp = (
            datetime.now(timezone.utc) - timedelta(seconds=(count - i) * 3)
        ).isoformat()

        data_points.append({
            "tick": t,
            "timestamp": timestamp,
            "heart_rate": hr,
            "systolic": systolic,
            "diastolic": diastolic,
            "spo2": spo2,
        })

    session["tick_index"] = idx + count
    return data_points


def _detect_anomalies(session: dict, data_points: list[dict]) -> list[dict]:
    """Detect anomalies PREVENTIVELY by analyzing trends before they spike.
    Uses sliding window trend analysis to predict dangerous values.
    Sensitive thresholds to catch rising trends early."""

    alerts = []
    history = session.get("recent_history", [])
    history.extend(data_points)
    # Keep last 20 points for trend analysis
    if len(history) > 20:
        history = history[-20:]
    session["recent_history"] = history

    if len(history) < 4:
        return alerts

    # Analyze trend of last 5 readings
    window = min(5, len(history))
    recent = history[-window:]
    hr_values = [p["heart_rate"] for p in recent]
    sys_values = [p["systolic"] for p in recent]
    spo2_values = [p["spo2"] for p in recent]

    # Linear trend slope
    def slope(values):
        n = len(values)
        if n < 2:
            return 0
        x_mean = (n - 1) / 2
        y_mean = sum(values) / n
        numer = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
        denom = sum((i - x_mean) ** 2 for i in range(n))
        return numer / denom if denom else 0

    hr_slope = slope(hr_values)
    sys_slope = slope(sys_values)
    spo2_slope = slope(spo2_values)

    latest = data_points[-1]
    ts = latest["timestamp"]
    cur_hr = latest["heart_rate"]
    cur_sys = latest["systolic"]
    cur_spo2 = latest["spo2"]

    # PREVENTIVE: Alert when trend predicts dangerous values
    predicted_hr = cur_hr + hr_slope * 8
    predicted_sys = cur_sys + sys_slope * 8
    predicted_spo2 = cur_spo2 + spo2_slope * 8

    # Track which alerts have been sent
    alerted_types = session.get("alerted_types", set())

    # --- Heart Rate Alerts ---
    if (cur_hr > 90 or predicted_hr > 100) and hr_slope > 0.5 and "tachycardia" not in alerted_types:
        alerted_types.add("tachycardia")
        alerts.append({
            "type": "tachycardia_warning",
            "severity": "high",
            "message": f"Preventive Alert: Heart rate trending upward ({cur_hr} bpm, slope +{hr_slope:.1f}/tick). "
                       f"Predicted to reach {predicted_hr:.0f} bpm. Monitor closely.",
            "current_value": cur_hr,
            "predicted_value": round(predicted_hr, 1),
            "vital": "heart_rate",
            "timestamp": ts,
        })

    if cur_hr > 120 and "tachycardia_critical" not in alerted_types:
        alerted_types.add("tachycardia_critical")
        alerts.append({
            "type": "tachycardia_critical",
            "severity": "critical",
            "message": f"CRITICAL: Heart rate has reached {cur_hr} bpm! Immediate medical attention recommended.",
            "current_value": cur_hr,
            "predicted_value": round(predicted_hr, 1),
            "vital": "heart_rate",
            "timestamp": ts,
        })

    # --- Blood Pressure Alerts ---
    if (cur_sys > 145 or predicted_sys > 150) and sys_slope > 0.5 and "hypertension" not in alerted_types:
        alerted_types.add("hypertension")
        alerts.append({
            "type": "hypertension_warning",
            "severity": "high",
            "message": f"Preventive Alert: Blood pressure rising ({cur_sys}/{latest['diastolic']} mmHg). "
                       f"Systolic predicted to reach {predicted_sys:.0f} mmHg.",
            "current_value": cur_sys,
            "predicted_value": round(predicted_sys, 1),
            "vital": "blood_pressure",
            "timestamp": ts,
        })

    if (cur_sys < 95 or predicted_sys < 90) and sys_slope < -0.5 and "hypotension" not in alerted_types:
        alerted_types.add("hypotension")
        alerts.append({
            "type": "hypotension_warning",
            "severity": "high",
            "message": f"Preventive Alert: Blood pressure dropping ({cur_sys}/{latest['diastolic']} mmHg). "
                       f"Systolic predicted to reach {predicted_sys:.0f} mmHg.",
            "current_value": cur_sys,
            "predicted_value": round(predicted_sys, 1),
            "vital": "blood_pressure",
            "timestamp": ts,
        })

    # --- SpO2 Alerts ---
    if (cur_spo2 < 95 or predicted_spo2 < 94) and spo2_slope < -0.05 and "hypoxia" not in alerted_types:
        alerted_types.add("hypoxia")
        alerts.append({
            "type": "hypoxia_warning",
            "severity": "critical",
            "message": f"Preventive Alert: SpO2 declining ({cur_spo2}%, slope {spo2_slope:.2f}/tick). "
                       f"Predicted to reach {predicted_spo2:.1f}% — oxygen support may be needed.",
            "current_value": cur_spo2,
            "predicted_value": round(predicted_spo2, 1),
            "vital": "spo2",
            "timestamp": ts,
        })

    if cur_spo2 < 92 and "hypoxia_critical" not in alerted_types:
        alerted_types.add("hypoxia_critical")
        alerts.append({
            "type": "hypoxia_critical",
            "severity": "critical",
            "message": f"CRITICAL: SpO2 has dropped to {cur_spo2}%! Immediate oxygen support required.",
            "current_value": cur_spo2,
            "predicted_value": round(predicted_spo2, 1),
            "vital": "spo2",
            "timestamp": ts,
        })

    session["alerted_types"] = alerted_types
    return alerts


_VITALS_SCENARIOS = [
    {
        "description": "Post-operative patient developing tachycardia with secondary hypoxia",
        "base_hr": 74, "base_sys": 122, "base_dia": 78, "base_spo2": 97.5,
        "events": [
            {"type": "tachycardia", "onset_tick": 6, "peak_tick": 20, "intensity": 1.1},
            {"type": "hypoxia", "onset_tick": 28, "peak_tick": 45, "intensity": 1.0},
        ],
    },
    {
        "description": "Elderly patient with progressive hypertension and tachycardia",
        "base_hr": 70, "base_sys": 126, "base_dia": 82, "base_spo2": 96.8,
        "events": [
            {"type": "hypertension", "onset_tick": 8, "peak_tick": 24, "intensity": 1.2},
            {"type": "tachycardia", "onset_tick": 30, "peak_tick": 48, "intensity": 0.9},
        ],
    },
    {
        "description": "Patient with respiratory distress showing hypoxia then hypotension",
        "base_hr": 76, "base_sys": 118, "base_dia": 76, "base_spo2": 97.0,
        "events": [
            {"type": "hypoxia", "onset_tick": 5, "peak_tick": 18, "intensity": 1.15},
            {"type": "hypotension", "onset_tick": 25, "peak_tick": 42, "intensity": 1.0},
        ],
    },
    {
        "description": "Sepsis-like presentation with tachycardia, hypotension, and desaturation",
        "base_hr": 72, "base_sys": 120, "base_dia": 80, "base_spo2": 97.2,
        "events": [
            {"type": "tachycardia", "onset_tick": 5, "peak_tick": 18, "intensity": 1.0},
            {"type": "hypotension", "onset_tick": 15, "peak_tick": 30, "intensity": 1.1},
            {"type": "hypoxia", "onset_tick": 32, "peak_tick": 50, "intensity": 0.9},
        ],
    },
    {
        "description": "Hypertensive crisis with secondary respiratory compromise",
        "base_hr": 68, "base_sys": 128, "base_dia": 84, "base_spo2": 97.8,
        "events": [
            {"type": "hypertension", "onset_tick": 7, "peak_tick": 22, "intensity": 1.15},
            {"type": "hypoxia", "onset_tick": 30, "peak_tick": 48, "intensity": 0.95},
        ],
    },
    {
        "description": "Acute blood loss pattern with hypotension and compensatory tachycardia",
        "base_hr": 75, "base_sys": 116, "base_dia": 74, "base_spo2": 98.0,
        "events": [
            {"type": "hypotension", "onset_tick": 6, "peak_tick": 20, "intensity": 1.2},
            {"type": "tachycardia", "onset_tick": 12, "peak_tick": 28, "intensity": 1.1},
        ],
    },
    {
        "description": "Cardiac arrhythmia with rapid heart rate escalation",
        "base_hr": 70, "base_sys": 124, "base_dia": 80, "base_spo2": 97.5,
        "events": [
            {"type": "tachycardia", "onset_tick": 8, "peak_tick": 22, "intensity": 1.2},
            {"type": "hypertension", "onset_tick": 26, "peak_tick": 44, "intensity": 0.85},
        ],
    },
    {
        "description": "Progressive respiratory failure with early desaturation",
        "base_hr": 73, "base_sys": 120, "base_dia": 78, "base_spo2": 96.5,
        "events": [
            {"type": "hypoxia", "onset_tick": 5, "peak_tick": 22, "intensity": 1.1},
            {"type": "tachycardia", "onset_tick": 18, "peak_tick": 35, "intensity": 1.0},
            {"type": "hypotension", "onset_tick": 38, "peak_tick": 55, "intensity": 0.85},
        ],
    },
]


@app.post("/vitals/start")
async def start_vitals_session(request: VitalsStartRequest):
    """Start a new vitals monitoring session with pre-built clinical scenarios.
    No external API calls — starts instantly."""

    session_id = str(uuid.uuid4())

    # Pick a random pre-built scenario (no API call needed)
    scenario = random.choice(_VITALS_SCENARIOS)

    # Add slight randomness to base vitals so repeated runs feel different
    base_hr = scenario["base_hr"] + random.randint(-3, 3)
    base_sys = scenario["base_sys"] + random.randint(-4, 4)
    base_dia = scenario["base_dia"] + random.randint(-3, 3)
    base_spo2 = round(scenario["base_spo2"] + random.uniform(-0.5, 0.5), 1)

    # Jitter the onset/peak ticks slightly for variety
    anomaly_events = []
    for event in scenario["events"]:
        anomaly_events.append({
            "type": event["type"],
            "onset_tick": event["onset_tick"] + random.randint(-2, 2),
            "peak_tick": event["peak_tick"] + random.randint(-3, 3),
            "intensity": round(event["intensity"] + random.uniform(-0.1, 0.1), 2),
        })

    session_data = {
        "session_id": session_id,
        "patient_id": request.patient_id,
        "patient_name": request.patient_name,
        "doctor_id": request.doctor_id,
        "emergency_contact_name": request.emergency_contact_name,
        "emergency_contact_phone": request.emergency_contact_phone,
        "location": request.location,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "base_hr": base_hr,
        "base_sys": base_sys,
        "base_dia": base_dia,
        "base_spo2": base_spo2,
        "anomaly_events": anomaly_events,
        "tick_index": 0,
        "recent_history": [],
        "alerted_types": set(),
        "scenario": scenario["description"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    vitals_sessions[session_id] = session_data
    print(f"Vitals session {session_id} started with {len(anomaly_events)} events: {scenario['description']}")
    return {
        "session_id": session_id,
        "scenario": session_data["scenario"],
        "status": "active",
    }


@app.post("/vitals/tick")
async def vitals_tick(request: VitalsTickRequest):
    """Get the next batch of vitals data points for a session."""
    session = vitals_sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Generate next batch of data
    data_points = _generate_synthetic_batch(session, count=5)

    # Detect anomalies preventively
    new_alerts = _detect_anomalies(session, data_points)

    # Store alerts and dispatch to doctor/emergency contact
    for alert in new_alerts:
        has_emergency = bool(session.get("emergency_contact_name") and session.get("emergency_contact_phone"))
        lat = session.get("latitude", 0.0)
        lng = session.get("longitude", 0.0)
        maps_url = f"https://www.google.com/maps?q={lat},{lng}" if lat and lng else ""
        alert_record = {
            "id": str(uuid.uuid4()),
            "session_id": request.session_id,
            "patient_id": session["patient_id"],
            "patient_name": session["patient_name"],
            "doctor_id": session["doctor_id"],
            "emergency_contact_name": session.get("emergency_contact_name", ""),
            "emergency_contact_phone": session.get("emergency_contact_phone", ""),
            "location": session.get("location", "Unknown"),
            "latitude": lat,
            "longitude": lng,
            "maps_url": maps_url,
            "alert_type": alert["type"],
            "severity": alert["severity"],
            "message": alert["message"],
            "vital": alert["vital"],
            "current_value": alert["current_value"],
            "predicted_value": alert["predicted_value"],
            "timestamp": alert["timestamp"],
            "read": False,
            "doctor_notified": bool(session.get("doctor_id")),
            "emergency_notified": has_emergency,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        vitals_alerts.append(alert_record)
        if has_emergency:
            print(f"EMERGENCY DISPATCH to {session['emergency_contact_name']} ({session['emergency_contact_phone']}): {alert['message']} | Location: {session.get('location', 'Unknown')}")
        print(f"VITALS ALERT [{alert['severity']}]: {alert['message']} -> Doctor {session.get('doctor_id', 'N/A')}")

    # Enrich alerts with location and contact info for the Flutter app
    lat = session.get("latitude", 0.0)
    lng = session.get("longitude", 0.0)
    enriched_alerts = []
    for alert in new_alerts:
        enriched = dict(alert)
        enriched["location"] = session.get("location", "Unknown")
        enriched["latitude"] = lat
        enriched["longitude"] = lng
        enriched["maps_url"] = f"https://www.google.com/maps?q={lat},{lng}" if lat and lng else ""
        enriched["emergency_contact_name"] = session.get("emergency_contact_name", "")
        enriched["emergency_contact_phone"] = session.get("emergency_contact_phone", "")
        enriched["patient_name"] = session.get("patient_name", "")
        enriched_alerts.append(enriched)

    return {
        "data_points": data_points,
        "alerts": enriched_alerts,
        "tick_index": session["tick_index"],
    }


@app.get("/vitals/alerts/doctor/{doctor_id}")
def get_vitals_doctor_alerts(doctor_id: str):
    """Get vitals alerts for a specific doctor."""
    alerts = [a for a in vitals_alerts if a["doctor_id"] == doctor_id]
    alerts.sort(key=lambda x: x["created_at"], reverse=True)
    return {"alerts": alerts}


@app.get("/vitals/alerts/patient/{patient_id}")
def get_vitals_patient_alerts(patient_id: str):
    """Get vitals alerts for a specific patient."""
    alerts = [a for a in vitals_alerts if a["patient_id"] == patient_id]
    alerts.sort(key=lambda x: x["created_at"], reverse=True)
    return {"alerts": alerts}


@app.put("/vitals/alerts/{alert_id}/read")
def mark_vitals_alert_read(alert_id: str):
    """Mark a vitals alert as read."""
    for alert in vitals_alerts:
        if alert["id"] == alert_id:
            alert["read"] = True
            return {"status": "ok"}
    raise HTTPException(status_code=404, detail="Alert not found")


@app.delete("/vitals/session/{session_id}")
def stop_vitals_session(session_id: str):
    """Stop a vitals monitoring session."""
    if session_id in vitals_sessions:
        del vitals_sessions[session_id]
        return {"status": "stopped"}
    raise HTTPException(status_code=404, detail="Session not found")
