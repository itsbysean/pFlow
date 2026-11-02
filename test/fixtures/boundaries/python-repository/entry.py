import os
from pathlib import Path

def run():
    path = Path(os.environ["REPORT_PATH"])
    return path.read_text(encoding="utf-8")
