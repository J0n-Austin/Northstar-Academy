"""Starter: pure transformation functions. Replace TODOs without mutating inputs."""
def normalize_account(raw):
    """Return {'id': positive int, 'owner': trimmed nonempty str, 'cents': nonnegative int}.
    Invalid values raise ValueError; bool is not an accepted int.
    Do not mutate raw.
    """
    return dict(raw) # TODO: rejects nothing, retains unexpected fields

def totals_by_owner(accounts):
    """Return {owner: total_cents}; do not mutate caller's accounts."""
    return {} # TODO

def unique_account_ids(accounts):
    """Keep first-seen positive IDs in input order, rejecting malformed IDs."""
    return [] # TODO
