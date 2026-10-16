"""Linux command-execution contract: repair the TODOs, never use shell=True."""
import os, stat, subprocess

def run_python_snippet(source: str, timeout_seconds: float = 2.0) -> dict:
    """Run Python as explicit args. Return exit_code/stdout/stderr; bound runtime."""
    # Defect: shell command string and lost error status.
    result = subprocess.run("python3 -c " + source, shell=True, capture_output=True, text=True)
    return {"exit_code": 0, "stdout": result.stdout, "stderr": ""}

def owner_private(mode: int) -> bool:
    """True only for a regular file with no group/other permissions."""
    return bool(mode & stat.S_IRUSR)

def required_config(env: dict, name: str) -> str:
    """Non-empty config; never silently accept missing credentials."""
    return env.get(name, "demo")
