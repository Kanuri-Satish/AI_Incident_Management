from sqlalchemy.orm import Session
from models import SessionLocal, Employee, engine, Base
import random

# Ensure tables exist
Base.metadata.create_all(bind=engine)

first_names = ["Anand", "Ashok", "Arjun", "Krishna", "Koushik", "Kesar", "Sindhu", "Lakshmi", "Tejaswi", "Shiva", "David", "Ruthu", "Marita", "Suhas", "Sanjay", "Satish", "Satya", "Sarah", "Charan", "Druthi", "Priya", "Rahul", "Amit", "Sneha", "Vikram", "Anjali"]
last_names = ["Battacharya", "Varma", "Naidu", "Sharma", "Raidu", "Chowdary", "Reddy", "Gouda", "Shetty", "Singh", "Patil", "Trump", "Patel", "Kumar", "Gupta", "Jain"]

departments = {
    "Engineering": ["Software Engineer", "Senior Developer", "Tech Lead", "QA Engineer", "DevOps Engineer"],
    "IT": ["Helpdesk Technician", "System Administrator", "Network Engineer", "Security Analyst"],
    "Finance": ["Accountant", "Payroll Specialist", "Financial Analyst", "Billing Coordinator"],
    "HR": ["HR Generalist", "Recruiter", "Onboarding Specialist", "Benefits Coordinator"],
    "Product": ["Product Manager", "UI/UX Designer", "Business Analyst"],
    "Marketing": ["Marketing Specialist", "Content Creator", "SEO Analyst"],
    "Legal": ["Corporate Counsel", "Compliance Officer", "Paralegal"]
}

skills_pool = ["Python", "Java", "SQL", "React", "AWS", "Azure", "Cybersecurity", "Payroll", "Taxation", "Recruitment", "Agile", "Design", "SEO", "Compliance"]

def seed_employees():
    db: Session = SessionLocal()
    try:
        # Check if we already have a lot of employees to prevent duplicates
        if db.query(Employee).count() > 100:
            print("Database already populated! Delete ticketing.db if you want a fresh start.")
            return

        print("Generating 1,000 corporate employees... Please wait.")
        employees_to_add = []
        
        for _ in range(1000):
            dept = random.choice(list(departments.keys()))
            role = random.choice(departments[dept])
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            name = f"{fname} {lname}"
            email = f"{fname.lower()}.{lname.lower()}{random.randint(100,9999)}@company.com"
            status = random.choices(["Available", "Busy", "On Leave"], weights=[60, 30, 10])[0]
            skills = ", ".join(random.sample(skills_pool, k=random.randint(1, 3)))
            avg_time = random.randint(15, 240)
            load = random.randint(0, 5) if status != "On Leave" else 0

            emp = Employee(
                name=name, email=email, department=dept, role=role,
                skills=skills, average_resolution_time=avg_time,
                current_ticket_load=load, status=status
            )
            employees_to_add.append(emp)

        # Bulk save is much faster for 1000 records
        db.bulk_save_objects(employees_to_add)
        db.commit()
        print("Successfully added 1,000 employees to your directory!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_employees()