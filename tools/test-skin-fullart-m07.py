#!/usr/bin/env python3
"""Isolated failure controls for the Skin 3701 private Fullart Asset Admission."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "tools/validate-skin-fullart-m07.py"
COPIED = [
    "canonical/skin-identities-3701.v1.json",
    "canonical/skin-hero-relations-3701.v1.json",
    "canonical/skin-source-orders-3701.v1.json",
    "canonical/skin-admission-registry-m05-g.v1.json",
    "canonical/skin-asset-registry-m05-g.v1.json",
    "canonical/skin-publication-approvals-m05-g.v1.json",
    "evidence/assets/skin-fullart-m07.v1.json",
    "generated/skin-consumer-public-m05-g.v1.json",
    "generated/skin-assets-public-m05-g.v1.json",
    "assets/skin-admissions/m07/skin-3701.webp",
]


def fixture():
    temporary = tempfile.TemporaryDirectory(prefix="m07-asset-negative-")
    root = Path(temporary.name)
    for relative in COPIED:
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / relative, target)
    return temporary, root


def run(root, expected):
    env = {**os.environ, "M07_ASSET_ROOT": str(root)}
    result = subprocess.run([sys.executable, str(VALIDATOR)], env=env, capture_output=True, text=True)
    assert (result.returncode == 0) is expected, result.stdout + result.stderr


def mutate_json(root, path, fn):
    file = root / path
    value = json.loads(file.read_text(encoding="utf-8"))
    fn(value)
    file.write_text(json.dumps(value), encoding="utf-8")


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

rejects("wrong Asset SkinID", "canonical/skin-asset-registry-m05-g.v1.json",
        lambda v: v["records"][-1].update(skinId=3702))
rejects("wrong Semantic Hero relation", "canonical/skin-hero-relations-3701.v1.json",
        lambda v: v["records"][0].update(heroId=6))
rejects("wrong Asset Evidence pointer", "canonical/skin-asset-registry-m05-g.v1.json",
        lambda v: v["records"][-1].update(assetEvidence="evidence/assets/missing.json"))
rejects("wrong official Prefab locator", "evidence/assets/skin-fullart-m07.v1.json",
        lambda v: v["records"][0]["source"].update(prefabLocator="Spine/General/Zigodlla_ABS/Zigodlla_Skin01_Prefab.prefab"))
rejects("wrong Run Artifact digest", "evidence/assets/skin-fullart-m07.v1.json",
        lambda v: v["records"][0]["render"]["artifact"].update(digest="sha256:" + "0" * 64))
rejects("wrong source PNG hash", "evidence/assets/skin-fullart-m07.v1.json",
        lambda v: v["records"][0]["conversion"].update(inputPngSha256="0" * 64))
rejects("wrong output WebP hash", "evidence/assets/skin-fullart-m07.v1.json",
        lambda v: v["records"][0]["output"].update(sha256="0" * 64))
rejects("wrong output size", "evidence/assets/skin-fullart-m07.v1.json",
        lambda v: v["records"][0]["output"].update(sizeBytes=1))
rejects("duplicate Asset Registry row", "canonical/skin-asset-registry-m05-g.v1.json",
        lambda v: v["records"].append(v["records"][-1]))
rejects("approved Publication connection", "canonical/skin-publication-approvals-m05-g.v1.json",
        lambda v: v["approvals"].append({"skinId": 3701, "status": "APPROVED", "approvedUrl": "./assets/skin-admissions/m07/skin-3701.webp", "approvalRecord": "test"}))
rejects("Public Consumer leak", "generated/skin-consumer-public-m05-g.v1.json",
        lambda v: v["skins"].append({"skinId": 3701, "heroId": 37, "sourceOrder": 1}))
rejects("Public Asset URL leak", "generated/skin-assets-public-m05-g.v1.json",
        lambda v: v["assets"].append({"skinId": 3701, "imageUrl": "./assets/skin-admissions/m07/skin-3701.webp"}))

temporary, root = fixture()
try:
    (root / "assets/skin-admissions/m07/skin-3701.webp").unlink()
    run(root, False)
    print("  rejected: missing WebP file")
finally:
    temporary.cleanup()

temporary, root = fixture()
try:
    asset = root / "assets/skin-admissions/m07/skin-3701.webp"
    data = bytearray(asset.read_bytes())
    data[0] ^= 1
    asset.write_bytes(data)
    run(root, False)
    print("  rejected: corrupt WebP bytes")
finally:
    temporary.cleanup()

print("M07 Asset failure controls: PASS (14 isolated identity, provenance, binary integrity and publication-boundary mutations)")
