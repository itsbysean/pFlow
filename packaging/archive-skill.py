"""Create a deterministic ZIP from a validated pFlow distribution."""
import json
from pathlib import Path
import sys
import zipfile

root = Path(sys.argv[1])
output = Path(sys.argv[2])
files = json.load(sys.stdin)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in sorted(files):
        info = zipfile.ZipInfo('pflow/' + name, date_time=(1980, 1, 1, 0, 0, 0))
        info.create_system = 3
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o100755 if name == 'scripts/pflow.mjs' else 0o100644) << 16
        archive.writestr(info, (root / name).read_bytes(), compresslevel=9)
