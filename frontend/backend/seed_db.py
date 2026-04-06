from models import SessionLocal, Employee

def seed_data():
    db = SessionLocal()
    
    # Check if already have employees so don't duplicate.
    if db.query(Employee).count() > 0:
        print("Database already has employees!")
        db.close()
        return

    dummy_employees = [
        Employee(name="Sarah Jenkins", email="sarah@company.com", department="Engineering", role="Backend Dev", skills="Database, Server, API", avg_resolution_time_hrs=1.5, current_ticket_load=2, status="Available"),
        Employee(name="Mike Chen", email="mike@company.com", department="IT", role="System Admin", skills="Access, Passwords, Hardware", avg_resolution_time_hrs=0.5, current_ticket_load=5, status="Busy"),
        Employee(name="Priya Patel", email="priya@company.com", department="Finance", role="Payroll Specialist", skills="Payroll, Reimbursement, Salary", avg_resolution_time_hrs=24.0, current_ticket_load=1, status="Available"),
        Employee(name="David Rossi", email="david@company.com", department="HR", role="HR Generalist", skills="Leave, Onboarding, Policy", avg_resolution_time_hrs=4.0, current_ticket_load=0, status="Available"),
        Employee(name="Elena Gomez", email="elena@company.com", department="Engineering", role="DevOps Engineer", skills="Server, Infrastructure, Cloud", avg_resolution_time_hrs=2.0, current_ticket_load=8, status="Busy"),
        Employee(name="Tom Hanks", email="tom@company.com", department="Legal", role="Compliance Officer", skills="Compliance, Contracts", avg_resolution_time_hrs=48.0, current_ticket_load=0, status="On Leave"),
    ]

    db.add_all(dummy_employees)
    db.commit()
    print("Successfully added 6 dummy employees to the database!")
    db.close()

if __name__ == "__main__":
    seed_data()