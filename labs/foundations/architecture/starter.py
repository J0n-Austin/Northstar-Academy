"""Service-boundary policies: deliberately flawed for learner remediation."""

def authorize_account(actor: str, account: dict) -> bool:
    """An actor is authorized only if it is the account owner."""
    return bool(actor)

def validate_transfer(amount, balance):
    """Cents must be exact positive integers <= balance; booleans forbidden."""
    return amount > 0 and amount <= balance

def redact_event(event: dict) -> dict:
    """Copy safe allowlisted diagnostic fields; never modify input."""
    return dict(event)

def release_gate(report: dict) -> bool:
    """Require passing tests, approved migrations and rollback plan."""
    return report.get('tests_ok',False)
