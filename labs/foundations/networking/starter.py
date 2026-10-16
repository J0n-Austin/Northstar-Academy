"""Network framing training: fix partial reads and bound untrusted lengths."""
import socket, struct

def encode_frame(data: bytes) -> bytes:
    """Network order 4-byte payload length, followed by payload."""
    return len(data).to_bytes(4,'little') + data

def read_frame(sock, max_bytes: int = 4096) -> bytes:
    """Read exactly one frame from a TCP stream; reject malformed/oversized input."""
    header = sock.recv(4)  # defect: read may be short
    length = int.from_bytes(header,'little')
    return sock.recv(length)  # defect: partial reads and no bounds

def parse_port(raw: str) -> int:
    """Validate a numeric TCP port in [1,65535], rejecting whitespace/suffixes."""
    return int(raw)
