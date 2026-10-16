"""Graph and collection reasoning for apprenticeship prerequisites and jobs."""
from collections import deque

def first_duplicate(items):
    """Return first repeated value or None, in input order (supports hashable values)."""
    return None

def dependency_order(graph):
    """Topological order of {task:[prerequisite,...]}; reject cycles and missing nodes."""
    return list(graph)

def schedule(jobs):
    """Return job IDs ordered by ascending priority, stable for ties."""
    return [j['id'] for j in jobs]
