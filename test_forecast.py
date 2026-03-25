from calicomp.forecast.forecast_model import predict_cash_inflow

history = [
    {"day_of_week": 1, "is_holiday": 0, "is_festival": 0, "revenue": 10000, "season": 0},
    {"day_of_week": 2, "is_holiday": 0, "is_festival": 0, "revenue": 12000, "season": 0},
    {"day_of_week": 3, "is_holiday": 0, "is_festival": 0, "revenue": 11000, "season": 0},
    {"day_of_week": 4, "is_holiday": 1, "is_festival": 0, "revenue": 8000, "season": 1},  # holiday dip
    {"day_of_week": 5, "is_holiday": 0, "is_festival": 1, "revenue": 15000, "season": 1}, # festival spike
]

# 🟢 TEST 1: Normal day
context1 = {"day_of_week": 1, "is_holiday": 0, "is_festival": 0, "season": 0}

# 🔴 TEST 2: Holiday
context2 = {"day_of_week": 6, "is_holiday": 1, "is_festival": 0, "season": 1}

# 🔥 TEST 3: Festival
context3 = {"day_of_week": 5, "is_holiday": 0, "is_festival": 1, "season": 1}

print("Normal:", predict_cash_inflow(history, context1))
print("Holiday:", predict_cash_inflow(history, context2))
print("Festival:", predict_cash_inflow(history, context3))