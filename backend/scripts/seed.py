import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from core.security import get_password_hash
from models.user import User
from models.document import BankAccount
from core.config import settings

async def seed():
    if not settings.DATABASE_URI:
        print("DATABASE_URI not configured. Skipping seed.")
        return
        
    engine = create_async_engine(settings.DATABASE_URI, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        from sqlalchemy import select
        
        try:
            res = await session.execute(select(User).filter_by(email="admin@calicomp.com"))
            admin = res.scalars().first()
            
            if not admin:
                admin = User(
                    email="admin@calicomp.com",
                    name="Admin User",
                    hashed_password=get_password_hash("admin123"),
                    business_name="CaliComp Demo Biz"
                )
                session.add(admin)
                await session.commit()
                print(f"Created demo user: {admin.id}")
            else:
                print("Demo user already exists.")
                
            res = await session.execute(select(BankAccount).filter_by(user_id=admin.id))
            ba = res.scalars().first()
            if not ba:
                ba = BankAccount(
                    user_id=admin.id,
                    bank_name="HDFC Bank",
                    account_number_masked="XXXX1234",
                    ifsc_code_optional="HDFC0001234"
                )
                session.add(ba)
                await session.commit()
                print(f"Created demo bank account: {ba.id}")
        except Exception as e:
            print(f"Seeding failed (perhaps run migrations first?): {e}")
            
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
