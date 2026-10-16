"""Starter: reproduce log-event ingestion and safe diagnostic output."""
def summarize(events):
    """Count only valid dict events with nonblank str 'type'; reject bad events.
    Preserve original input and return deterministic counts by type.
    """
    counts={}
    for event in events:
        kind=event.get('type','unknown') # TODO missing/invalid type accepted
        counts[kind]=counts.get(kind,0)+1
    return counts

def safe_event(event):
    """Return public structured event with event, request_id, outcome only;
    never expose tokens, headers, private bodies or other unapproved keys.
    """
    return dict(event) # TODO leaks arbitrary fields
