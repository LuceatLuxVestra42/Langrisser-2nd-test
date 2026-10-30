#!/usr/bin/env python3
"""Isolated rejection tests for M05-D Skin 601 Asset Admission."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "tools/validate-skin-fullart-m05-d.py"
COPIED = [
    "canonical/skin-admission-registry-m05-g.v1.json",
    "canonical/skin-identities-m05-c.v1.json",
    "canonical/skin-hero-relations-m05-c.v1.json",
    "canonical/skin-source-orders-m05-c.v1.json",
    "canonical/skin-asset-registry-m05-g.v1.json",
    "evidence/assets/skin-fullart-m05-d.v1.json",
    "assets/skin-admissions/m05-d/skin-601.webp",
]


def fixture():
    temp = tempfile.TemporaryDirectory(prefix="m05-d-negative-")
    root = Path(temp.name)
    for relative in COPIED:
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / relative, target)
    return temp, root


def run(root, expected):
    env = {**os.environ, "M05_D_ROOT": str(root)}
    result = subprocess.run([sys.executable, str(VALIDATOR)], env=env, capture_output=True, text=True)
    assert (result.returncode == 0) is expected, result.stdout + result.stderr


def mutate_json(root, path, fn):
    file = root / path
    value = json.loads(file.read_text())
    fn(value)
    file.write_text(json.dumps(value))


def rejects(label, path, fn):
    temp, root = fixture()
    try:
        mutate_json(root, path, fn)
        run(root, False)
        print(f"  rejected: {label}")
    finally:
        temp.cleanup()


baseline, baseline_root = fixture()
try:
    run(baseline_root, True)
finally:
    baseline.cleanup()
rejects("wrong output digest", "evidence/assets/skin-fullart-m05-d.v1.json", lambda v: v["records"][0]["output"].update(sha256="0" * 64))
rejects("wrong file size", "evidence/assets/skin-fullart-m05-d.v1.json", lambda v: v["records"][0]["output"].update(sizeBytes=1))
rejects("wrong dimensions", "evidence/assets/skin-fullart-m05-d.v1.json", lambda v: v["records"][0]["output"].update(dimensions=[1600, 737]))
rejects("wrong Source locator", "evidence/assets/skin-fullart-m05-d.v1.json", lambda v: v["records"][0]["source"].update(frozenLocator="Spine/Char/Leon_ABS/Leon_Skin2_Prefab.prefab"))
rejects("missing Source provenance", "evidence/assets/skin-fullart-m05-d.v1.json", lambda v: v["records"][0]["source"].pop("bundle"))
rejects("duplicate Asset Registry entry", "canonical/skin-asset-registry-m05-g.v1.json", lambda v: v["records"].append(v["records"][-1]))
rejects("wrong semantic owner", "canonical/skin-hero-relations-m05-c.v1.json", lambda v: v["records"][0].update(heroId=999))

for label, transform in [
    ("corrupt WebP", lambda data: data.__setitem__(slice(0, 4), b"NOPE")),
    ("WebP without expected bytes", lambda data: data.__setitem__(0, data[0] ^ 0x01)),
]:
    temp, root = fixture()
    try:
        asset = root / "assets/skin-admissions/m05-d/skin-601.webp"
        data = bytearray(asset.read_bytes())
        transform(data)
        asset.write_bytes(data)
        run(root, False)
        print(f"  rejected: {label}")
    finally:
        temp.cleanup()

print("M05-D failure controls: PASS (9 isolated Asset, provenance, and Semantic mutations)")
