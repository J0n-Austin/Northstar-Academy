#!/usr/bin/env bash
# Reset the lab to its starting state. Safe to run again any time.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# Make the key file "too open" so Task 4 has something to fix.
chmod 644 scenario/secrets/service.key

# Fresh answers directory (does not delete your work unless you ask).
mkdir -p answers
[ -f answers/.gitkeep ] || touch answers/.gitkeep

# Make scripts runnable.
chmod +x run-checks.sh check/*.sh 2>/dev/null || true

echo "Lab ready. Start with tasks/01-find-errors.md"
echo "Run 'bash run-checks.sh' any time to see your score."
