#!/usr/bin/env python3
"""Isolated failure tests for M06 Skin 602-606 Asset Admission."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "tools/validate-skin-fullart-m06.py"
COPIED = [
    "canonical/skin-admission-registry-m05-g.v1.json",
    "canonical/skin-asset-registry-m05-g.v1.json",
    "evidence/assets/skin-fullart-m06.v1.json",
    *[f"assets/skin-admissions/m06/skin-{sid}.webp" for sid in (602, 603, 604, 605, 606)],
]


def fixture():
    temporary = tempfile.TemporaryDirectory(prefix="m06-asset-negative-")
    root = Path(temporary.name)
    for relative in COPIED:
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / relative, target)
    return temporary, root


def run(root, expected):
    env = {**os.environ, "M06_ASSET_ROOT": str(root)}
    result = subprocess.run([sys.executable, str(VALIDATOR)], env=env, capture_output=True, text=True)
    assert (result.returncode == 0) is expected, result.stdout + result.stderr


def mutate_json(root, path, fn):
    file = root / path
    value = json.loads(file.read_text())
    fn(value)
    file.write_text(json.dumps(value))


def rejects(label, path, fn):
    temporary, root = fixture()
    try:
        mutate_json(root, path, fn)
        run(root, False)
        print(f"  rejected: {label}")
    finally:
        temporary.cleanup()


temporary, root = fixture()
try:
    run(root, True)
finally:
    temporary.cleanup()
rejects("wrong output SHA", "evidence/assets/skin-fullart-m06.v1.json", lambda v: v["records"][0]["output"].update(sha256="0" * 64))
rejects("wrong bytes", "evidence/assets/skin-fullart-m06.v1.json", lambda v: v["records"][0]["output"].update(sizeBytes=1))
rejects("wrong Prefab locator", "evidence/assets/skin-fullart-m06.v1.json", lambda v: v["records"][0]["source"].update(frozenLocator="Spine/Char/Leon_ABS/Leon_Skin2_Range_Prefab.prefab"))
rejects("wrong source-order linkage", "evidence/assets/skin-fullart-m06.v1.json", lambda v: v["records"][1]["semanticReference"].update(sourceOrder=2))
rejects("duplicate Registry SkinID", "canonical/skin-asset-registry-m05-g.v1.json", lambda v: v["records"].append(v["records"][-1]))
rejects("missing Semantic admission", "canonical/skin-admission-registry-m05-g.v1.json", lambda v: v["admissions"].__setitem__(slice(None), [r for r in v["admissions"] if r["skinId"] != 602]))
rejects("missing transparency proof", "evidence/assets/skin-fullart-m06.v1.json", lambda v: v["records"][0]["output"]["alpha"].update(transparentPixelCount=0))
for label, transform in [("corrupt WebP signature", lambda data: data.__setitem__(slice(0, 4), b"NOPE")),
                         ("modified image bytes", lambda data: data.__setitem__(0, data[0] ^ 1))]:
    temporary, root = fixture()
    try:
        image = root / "assets/skin-admissions/m06/skin-602.webp"
        data = bytearray(image.read_bytes())
        transform(data)
        image.write_bytes(data)
        run(root, False)
        print(f"  rejected: {label}")
    finally:
        temporary.cleanup()

print("M06 Asset failure controls: PASS (9 isolated binary, provenance, semantic-link, alpha and duplication mutations)")
