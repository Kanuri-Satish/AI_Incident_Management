from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    department = Column(String, index=True)
    role = Column(String)
    skills = Column(String) # Stored as comma-separated string, e.g., "Database, Python, AWS"
    average_resolution_time = Column(Integer, default=0) # In minutes
    current_ticket_load = Column(Integer, default=0)
    status = Column(String, default="Available") # Available, Busy, On Leave
    
    tickets = relationship("Ticket", back_populates="assignee")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    
    # Module 1: AI Analysis Fields
    category = Column(String)
    ai_summary = Column(String)
    severity = Column(String)
    sentiment = Column(String)
    recommended_path = Column(String)
    confidence_score = Column(Integer)
    estimated_time = Column(String)
    
    # Module 2: Auto-Resolution
    auto_resolved = Column(Boolean, default=False)
    auto_response_text = Column(Text, nullable=True)
    feedback_helpful = Column(Boolean, nullable=True) # True = Yes, False = No
    
    # Module 5: Lifecycle
    status = Column(String, default="New") # New, Assigned, In Progress, Pending Info, Resolved, Closed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    assigned_to_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    assignee = relationship("Employee", back_populates="tickets")
    
    events = relationship("TicketEvent", back_populates="ticket")

# Module 5: Ticket Timeline View
class TicketEvent(Base):
    __tablename__ = "ticket_events"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    action = Column(String) # e.g., "Created", "AI Analyzed", "Routed", "Status Changed"
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    ticket = relationship("Ticket", back_populates="events")

# Database Setup
engine = create_engine("sqlite:///./ticketing.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)