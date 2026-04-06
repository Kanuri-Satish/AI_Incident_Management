from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from groq import Groq
import json
import os

from models import SessionLocal, Employee, Ticket, TicketEvent

app = FastAPI(title="Enterprise AI Ticketing System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*","https://ai-incident-management.vercel.app"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.environ.get("API_KEY")
client = Groq(api_key=GROQ_API_KEY)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TicketRequest(BaseModel):
    description: str

@app.post("/api/tickets/submit")
def submit_ticket(request: TicketRequest, db: Session = Depends(get_db)):
    
    # --- MODULE 1: AI Analysis & Intake ---
    prompt = f"""
    You are an Enterprise AI Ticketing Architect. Analyze the following ticket description and return ONLY a valid JSON object. Do not include markdown formatting.
    
    Ticket: "{request.description}"

    STRICT ROUTING RULES:
    - Database issue / data corruption -> Engineering
    - Server down / performance issue -> Engineering / DevOps
    - Payroll / salary / reimbursement -> Finance
    - Leave / HR policy / onboarding -> HR
    - Access / permissions / account lock -> IT
    - Product bug / feature request -> Product / Engineering
    - Marketing / content / branding -> Marketing
    - Legal / compliance query -> Legal

    Output format MUST be exactly this JSON structure:
    {{
        "category": "Billing, Bug, Access, HR, Server, DB, Feature, Other",
        "ai_summary": "A 2-3 sentence professional summary of the issue.",
        "severity": "Critical, High, Medium, Low",
        "recommended_path": "Auto-resolve or Assign to department",
        "sentiment": "Frustrated, Neutral, Polite",
        "suggested_department": "Engineering, DevOps, Finance, HR, IT, Product, Marketing, Legal",
        "confidence_score": "e.g. 92",
        "estimated_time": "e.g. 2 hours",
        "auto_response": "If recommended_path is 'Auto-resolve', provide a helpful, professional response addressing the specific issue. Otherwise, leave blank."
    }}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile", 
            temperature=0.1, 
        )
        raw_text = chat_completion.choices[0].message.content.strip()
        raw_text = raw_text.replace("```json", "").replace("```", "")
        ai_data = json.loads(raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {e}")

    # --- MODULE 3: Priority Bump Logic ---
    severity = ai_data.get("severity")
    category = ai_data.get("category")
    
    if category in ["DB", "Server"]:
        severity = "Critical"
    elif category in ["Access", "Legal"]:
        severity = "High"

    assigned_employee_id = None
    status = "New"
    auto_resolved = False

    # --- MODULE 2 & 4: Routing & Auto-Resolution ---
    if ai_data.get("recommended_path") == "Auto-resolve":
        status = "Resolved"
        auto_resolved = True
    else:
        target_dept = ai_data.get("suggested_department")
        # Load-aware, Availability-aware routing
        employee = db.query(Employee).filter(
            Employee.department == target_dept,
            Employee.status == "Available"
        ).order_by(Employee.current_ticket_load.asc()).first()

        # Fallback to busy employees if none available
        if not employee:
            employee = db.query(Employee).filter(
                Employee.department == target_dept
            ).order_by(Employee.current_ticket_load.asc()).first()

        if employee:
            assigned_employee_id = employee.id
            status = "Assigned"
            employee.current_ticket_load += 1 

    # --- MODULE 5: Ticket Creation & Timeline ---
    new_ticket = Ticket(
        description=request.description,
        category=ai_data.get("category"),
        ai_summary=ai_data.get("ai_summary"),
        severity=severity,
        sentiment=ai_data.get("sentiment"),
        recommended_path=ai_data.get("recommended_path"),
        confidence_score=int(ai_data.get("confidence_score", 0)),
        estimated_time=ai_data.get("estimated_time"),
        status=status,
        auto_resolved=auto_resolved,
        auto_response_text=ai_data.get("auto_response") if auto_resolved else None,
        assigned_to_id=assigned_employee_id
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # Log the timeline event
    log_msg = "Ticket Auto-Resolved by AI." if auto_resolved else f"Routed to {ai_data.get('suggested_department')}."
    event = TicketEvent(ticket_id=new_ticket.id, action="AI Triage Complete", note=log_msg)
    db.add(event)
    db.commit()

    return {
        "message": "Ticket processed!",
        "ticket_id": new_ticket.id,
        "ai_analysis": ai_data,
        "final_severity": severity,
        "assigned_employee_id": assigned_employee_id,
        "auto_resolved": auto_resolved
    }

# --- MODULE 5: Fetch Ticket Queue ---
@app.get("/api/tickets")
def get_tickets(db: Session = Depends(get_db)):
    # Returns all tickets, newest first
    return db.query(Ticket).order_by(Ticket.created_at.desc()).all()

# --- MODULE 4: Fetch Employee Directory ---
@app.get("/api/employees")
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()

# --- MODULE 6: Analytics Dashboard Data ---
@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total_tickets = db.query(Ticket).count()
    resolved = db.query(Ticket).filter(Ticket.status == "Resolved").count()
    auto_resolved = db.query(Ticket).filter(Ticket.auto_resolved == True).count()
    
    return {
        "total_tickets": total_tickets,
        "open_tickets": total_tickets - resolved,
        "resolved_tickets": resolved,
        "auto_resolved": auto_resolved,
        "auto_resolution_rate": f"{(auto_resolved / total_tickets * 100):.1f}%" if total_tickets > 0 else "0%"
    }