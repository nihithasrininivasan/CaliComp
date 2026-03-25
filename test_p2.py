from calicomp.liquidity.runway import RunwayCalculator
from calicomp.solver.prioritizer import PaymentPrioritizer
from calicomp.explainability.explainer import DecisionExplainer
from calicomp.interfaces.engine import CaliCompEngine

print("=== RUNWAY TEST ===")
transactions = [
    {"amount": 10000, "date": "2026-03-25", "type": "credit"},
    {"amount": 5000, "date": "2026-03-26", "type": "debit"},
    {"amount": 7000, "date": "2026-03-27", "type": "debit"}
]

rc = RunwayCalculator()
print(rc.compute(transactions))


print("\n=== SOLVER TEST ===")
obligations = [
    {"id": 1, "amount": 5000, "due_days": 2, "penalty": 200, "flexible": 0},
    {"id": 2, "amount": 3000, "due_days": 5, "penalty": 50, "flexible": 1}
]

pp = PaymentPrioritizer()
solver_result = pp.solve(obligations, 5000)
print(solver_result)


print("\n=== EXPLAINABILITY TEST ===")
explainer = DecisionExplainer()
print(explainer.explain(solver_result["scoring_matrix"]))


print("\n=== FULL ENGINE TEST ===")
engine = CaliCompEngine()
print(engine.compute_runway(transactions))
print(engine.prioritize(obligations, 5000))