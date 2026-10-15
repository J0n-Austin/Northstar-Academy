# Service foundations

## Python modules and data flow

Trace a request from BaseHTTPRequestHandler through Bank methods into SQLite. Understand Python packages, argument validation and clear contracts. List/dict structures represent JSON and rows, but only explicit serialization is exposed.

## HTTP and safe API design

Learn GET and POST, status codes 200/201/400/403/404/409, JSON content types, how an API client reacts to changing schemas. A 200 response alone does not mean the correct payload was returned.

## SQL and pagination

Use SELECT, WHERE, ORDER BY and LIMIT. Filter by owner before ordering/limiting so results never include another tenant. Verify edge cases in unittest and via curl.

## Engineering workflow

Inspect repo, run baseline smoke, reproduce failing test, patch on dedicated branch, document behavior, ask for review.

## Checkpoint

Write two examples of a failure mode and a test that would detect each one.

## Workstation lab: follow a request

Start `python3 -m app.server --port 8765` and use curl from a second terminal. The `ThreadingHTTPServer` receives a request; its handler parses the path and query string; `Bank` owns the database logic; SQLite stores synthetic rows. Trace one GET end to end. In your report, draw a four-box diagram labeled client, handler, domain operation, database. Record the actual HTTP status and JSON fields. A handler that returns a successful status but wrong JSON violates its contract.

## Python foundations in this codebase

Read `class Bank`, the exception hierarchy, and `connect()`. A context manager handles commit/rollback/close. A dictionary serializes into a JSON object, while a list serializes into a JSON array. A tuple passed to a parameterized SQL call provides individual bound values. Explain the difference between a programming exception and a business error returned as a 4xx response.

## Database design and query cost

`accounts` has an integer primary key, an owner, and a balance in integer cents. Why cents rather than floats? How could ORDER BY and LIMIT behave without a stable order? Analyze the difference between limiting all rows and limiting just the requesting user's rows. A future real API might use cursor-based pagination and richer indexes, but a correct bounded query is the first requirement.

## Ticket handoff exercise

Before editing, write (1) the reproduction command, (2) the expected output, (3) the actual output, (4) the likely code path, and (5) your smallest safe proposed change. Add a negative test for invalid input. Create a branch, commit, and write a one-paragraph PR explanation that a new teammate could follow.
