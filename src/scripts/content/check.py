#!/usr/bin/env python3
"""Run all content consistency checks."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

CHECKS = Path(__file__).parent.glob("check_*.py")

for check in sorted(CHECKS):
    result = subprocess.run([sys.executable, check])
    if result.returncode:
        raise SystemExit(result.returncode)
