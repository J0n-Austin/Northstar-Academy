"""Starter: normalize transaction cents; write/repair meaningful contracts."""
def parse_cents(value):
    """Accept positive int (not bool), reject all other types and <=0."""
    if isinstance(value,(int,float)) and value>=0:
        return round(value) # TODO accepts float, bool and zero
    return 0 # TODO silent fallback

def can_transfer(balance,cents):
    """Return True iff both int cents and balance are valid, cents>0, balance>=cents."""
    return balance>cents # TODO boundary bug and validation
