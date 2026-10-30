#!/usr/bin/env python3
"""Independent M05-D admission check for the Skin 601 Fullart asset."""
import hashlib
import json
import os
from pathlib import Path

from PIL import Image

ROOT = Path(os.environ.get("M05_D_ROOT", Path(__file__).resolve().parents[1])).resolve()
EXPECTED_SHA = "a3a311f273b5ca02faff592204a69c454dcb75ae591c9cb9d7cc1b5950d22298"
EXPECTED_SOURCE = "Spine/Char/Leon_ABS/Leon_Skin_Prefab.prefab"
EXPECTED_SIZE = 159980
EXPECTED_DIMENSIONS = [737, 1600]


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def validate():
    manifest_path = "evidence/assets/skin-fullart-m05-d.v1.json"
    manifest = read(manifest_path)
    assert manifest["schemaVersion"] == 1
    assert len(manifest["records"]) == 1
    record = manifest["records"][0]
    assert record["skinId"] == 601
    assert record["semanticReference"] == {"admission": "M05-C-SKIN-601", "heroId": 6, "sourceOrder": 1}
    source = record["source"]
    assert source["repository"] == "LuceatLuxVestra42/langrisser-future-guide"
    assert source["sourceMainCommit"] == "57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff"
    assert source["frozenLocator"] == EXPECTED_SOURCE
    assert source["installationPackage"]["version"] == "1.1.113"
    assert source["installationPackage"]["packagePart"] == 37
    assert source["installationPackage"]["package"] == "InstallPage_1.1.113_37.zip"
    assert source["referenceManifestGitBlobSha"] == "e31ee418bec6809096a4528ad1117441a163430b"
    assert source["referenceValidationGitBlobSha"] == "116936d12eeebd79928d63c415d4803cf6a5bd6b"
    assert source["bundle"]["name"] == "spine_char_leon_abs.b"
    assert source["bundle"]["sourceArchivePath"].endswith("/spine_char_leon_abs.b")
    assert source["bundle"]["sizeBytes"] == 11877076
    assert source["bundle"]["sha256"] == "3fde9e1d477bfb8c7426e11036a7432f213237ef36944706948789a2e1c717da"
    assert source["referenceValidationStatus"] == "PASS_SKIN_FULLART_REFERENCE_ASSETS"
    acquired = source["acquiredFrom"]
    assert acquired["httpStatus"] == 200 and acquired["bytes"] == EXPECTED_SIZE
    assert acquired["url"].endswith("/57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff/public/images/skin-fullart/601.webp")
    assert acquired["gitBlobSha"] == "ff1e239aba0d523fe76baf1cb7df17d2ef78d264"
    assert source["legacyExpectedSha256"] == EXPECTED_SHA
    assert record["renderer"]["rendererStatus"] == "PASS_LEON_REFERENCE_FULLART_RENDER"
    assert record["renderer"]["pose"] == {"animation": "idle_Normal", "timeSeconds": 0.0}
    assert record["output"]["path"] == "assets/skin-admissions/m05-d/skin-601.webp"
    assert record["output"]["format"] == "image/webp"
    assert record["output"]["sha256"] == EXPECTED_SHA
    assert record["output"]["dimensions"] == EXPECTED_DIMENSIONS
    assert record["output"]["sizeBytes"] == EXPECTED_SIZE
    assert record["visualReview"]["status"] == "PASS"
    assert record["visualReview"]["sameBytesAsLegacyReference"] is True

    asset_path = ROOT / record["output"]["path"]
    data = asset_path.read_bytes()
    assert len(data) == EXPECTED_SIZE, "Asset byte size mismatch"
    digest = hashlib.sha256(data).hexdigest()
    assert digest == EXPECTED_SHA, "Asset SHA-256 mismatch"
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", "invalid WebP signature"
    with Image.open(asset_path) as image:
        image.load()
        assert image.format == "WEBP", "decoder did not identify WebP"
        assert list(image.size) == EXPECTED_DIMENSIONS, "Asset dimensions mismatch"
        assert image.mode in ("RGBA", "LA", "P"), "WebP has no alpha channel"
        alpha = image.convert("RGBA").getchannel("A")
        assert alpha.getextrema()[0] == 0, "WebP has no transparent pixels"
        transparent_pixels = alpha.histogram()[0]
        assert transparent_pixels > 0
        assert transparent_pixels == record["output"]["alpha"]["transparentPixelCount"]

    semantic = read("canonical/skin-admission-registry-m05-g.v1.json")
    assert any(row["admissionId"] == "M05-C-SKIN-601" and row["status"] == "APPROVED" for row in semantic["admissions"])
    identity = read("canonical/skin-identities-m05-c.v1.json")
    relation = read("canonical/skin-hero-relations-m05-c.v1.json")
    order = read("canonical/skin-source-orders-m05-c.v1.json")
    assert any(row["skinId"] == 601 for row in identity["records"])
    assert any(row["skinId"] == 601 and row["heroId"] == 6 for row in relation["records"])
    assert any(row["skinId"] == 601 and row["sourceOrder"] == 1 for row in order["records"])

    registry = read("canonical/skin-asset-registry-m05-g.v1.json")
    matches = [row for row in registry["records"] if row["skinId"] == 601]
    assert len(matches) == 1, "Asset Registry must contain exactly one 601 record"
    assert matches[0] == {"skinId": 601, "assetRecordSkinId": 601, "assetEvidence": manifest_path,
                          "admissionStatus": "APPROVED", "assetValidator": "tools/validate-skin-fullart-m05-d.py"}
    assert {row["skinId"] for row in registry["records"] if row["admissionStatus"] == "APPROVED"} == {102, 103, 104, 105, 601}

    approvals = read("canonical/skin-publication-approvals-m05-g.v1.json")["approvals"]
    assert {row["skinId"] for row in approvals if row["status"] == "APPROVED"} == {102, 103, 104, 105}
    public_consumer = read("generated/skin-consumer-public-m05-g.v1.json")
    public_assets = read("generated/skin-assets-public-m05-g.v1.json")
    assert len(public_consumer["skins"]) == 4 and all(row["skinId"] != 601 for row in public_consumer["skins"])
    assert len(public_assets["assets"]) == 4 and all(row["skinId"] != 601 for row in public_assets["assets"])
    print("M05-D Skin 601 Asset Admission: PASS (WebP, SHA-256, size, dimensions, alpha, Semantic link, private/public boundary)")


if __name__ == "__main__":
    validate()
