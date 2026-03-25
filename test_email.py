from calicomp.actions.email_generator import EmailGenerator

generator = EmailGenerator()   # ✅ no arguments here

result = generator.generate_email(   # ✅ arguments go here
    name="ABC Suppliers",
    amount=5000,
    decision="deferred",
    relationship="vendor"
)

print(result)