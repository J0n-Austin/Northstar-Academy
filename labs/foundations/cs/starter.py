"""Starter: algorithms powering event processing and curriculum prerequisites."""
def frequencies(items):
    """Return {item: count} in expected O(n) time. Items are hashable strings."""
    return {} # TODO

def topo_order(dependencies):
    """Return deterministic list of nodes with prerequisites first.
    dependencies: {node: [prerequisite nodes]}. Raise ValueError for missing nodes/cycles.
    Visit roots sorted alphabetically; visit each dependency sorted as well.
    """
    return list(dependencies) # TODO
