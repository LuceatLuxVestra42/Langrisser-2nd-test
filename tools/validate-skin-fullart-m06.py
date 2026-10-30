#!/usr/bin/env python3
"""Independent M06 Asset Admission verification for Hero 6 Skin Fullarts 602-606."""
import hashlib
import json
import os
from pathlib import Path

from PIL import Image

ROOT = Path(os.environ.get("M06_ASSET_ROOT", Path(__file__).resolve().parents[1])).resolve()
LEGACY = "57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff"
SNAPSHOT = "6475e63ee23d18adf733756c26a14fa9e3ed662c"
BUNDLE_SHA = "3fde9e1d477bfb8c7426e11036a7432f213237ef36944706948789a2e1c717da"
LEGACY_BLOBS = {
    602: "501c1c96181ef97199fdc3ef8594acd5cdda7022",
    603: "fe7af0ae2804a01d0450616bc63908a41759e2b8",
    604: "f37a219e3329cfec0da5afa3cad3d05cdb44eea2",
    605: "725b4bd3432b5119e00832f7c1f21e63fca8ab30",
    606: "89e9e2df1c52d380dec242308b43f6edac3049ae",
}
EXPECTED = {
    602: (2, "Spine/Char/Leon_ABS/Leon_Skin2_Prefab.prefab", 1195, 1600, 232916, "6bada0ead22ef77345b4d70d6dcd61b0859346af4992a670f0d44ff5211e96c8", 1239912, "PASS_LEON_REFERENCE_FULLART_RENDER"),
    603: (3, "Spine/Char/Leon_ABS/Leon_Skin3_Prefab.prefab", 1241, 1600, 207196, "f332a8f40e6b18b7dca6f58d82da7f4f9aa136420695afab2f0ee59debb37eb5", 1318323, "PASS_LEON_REFERENCE_FULLART_RENDER"),
    604: (4, "Spine/Char/Leon_ABS/Leon_Skin04_Prefab.prefab", 1296, 1600, 322998, "88272ddd4e8728a251db143058514d8f51071ffd830f4bdba288c62d7f880689", 1129971, "PASS_LEON_REFERENCE_FULLART_RENDER_WITH_UNIFORM_ATLAS_SCALE"),
    605: (5, "Spine/Char/Leon_ABS/Leon_Skin5_Prefab.prefab", 576, 1600, 110520, "1a6d17329535c34d8e70bc1a988c669e32898643049435dbe2b5f079122b02e3", 538435, "PASS_LEON_REFERENCE_FULLART_RENDER"),
    606: (6, "Spine/Char/Leon_ABS/Leon_Skin06_Prefab.prefab", 1271, 1600, 324268, "60fc6cb6b5e090ee94603b5ce140d24ede4487c493a7654665beb785893cd9b7", 927874, "PASS_LEON_REFERENCE_FULLART_RENDER"),
}


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def validate():
    manifest_path = "evidence/assets/skin-fullart-m06.v1.json"
    manifest = read(manifest_path)
    assert manifest["schemaVersion"] == 1
    assert manifest["assetSourceAuthority"] == {"repository": "LuceatLuxVestra42/langrisser-future-guide", "sourceMainCommit": LEGACY, "kind": "official-unity-client-asset-source", "installVersion": "1.1.113"}
    assert "Unity Prefab and dependency resolution were not independently repeated" in " ".join(manifest["limitations"])
    assert [r["skinId"] for r in manifest["records"]] == list(EXPECTED), "M06 Asset manifest must contain exactly 602-606 in Source Order"
    admission = read("canonical/skin-admission-registry-m05-g.v1.json")
    semantic = {r["skinId"]: r for r in admission["admissions"] if r["status"] == "APPROVED"}
    registry = read("canonical/skin-asset-registry-m05-g.v1.json")
    asset_rows = [r for r in registry["records"] if r["admissionStatus"] == "APPROVED"]
    assert len({r["skinId"] for r in asset_rows}) == len(asset_rows), "Asset Registry has duplicate approved SkinIDs"
    assert {102, 103, 104, 105, 601, *EXPECTED}.issubset({r["skinId"] for r in asset_rows}), "M04/M05/M06 approved Assets must coexist"

    for record in manifest["records"]:
        sid = record["skinId"]
        order, locator, width, height, size, digest, transparent_count, render_status = EXPECTED[sid]
        assert semantic[sid]["admissionId"] == f"M06-SKIN-{sid}"
        assert record["semanticReference"] == {"admission": f"M06-SKIN-{sid}", "heroId": 6, "sourceOrder": order}
        source = record["source"]
        assert source["repository"] == "LuceatLuxVestra42/langrisser-future-guide"
        assert source["sourceMainCommit"] == LEGACY and source["snapshotCommit"] == SNAPSHOT
        assert source["referenceManifest"] == "data/generated/skin-fullart-reference.v1.json"
        assert source["referenceValidation"] == "data/validation/skin-fullart-reference.v1.json"
        assert source["referenceValidationStatus"] == "PASS_SKIN_FULLART_REFERENCE_ASSETS"
        assert source["frozenLocator"] == locator
        assert source["installationPackage"] == {"kind": "official-installer", "version": "1.1.113",
            "package": "InstallPage_1.1.113_37.zip", "sizeBytes": 11877076, "packagePart": 37,
            "url": "http://mhmnzupdate.zlongame.com/MHMNZ/InstallVersion/InstallPage_1.1.113/InstallPage_1.1.113_37.zip"}
        assert source["referenceManifestGitBlobSha"] == "e31ee418bec6809096a4528ad1117441a163430b"
        assert source["referenceValidationGitBlobSha"] == "116936d12eeebd79928d63c415d4803cf6a5bd6b"
        assert source["bundle"] == {"name": "spine_char_leon_abs.b", "sizeBytes": 11877076, "sha256": BUNDLE_SHA,
                                     "sourceArchivePath": "Client/Langrisser_Data/StreamingAssets/ExportAssetBundle/spine_char_leon_abs.b"}
        assert source["legacyOutput"] == {"path": f"public/images/skin-fullart/{sid}.webp", "gitBlobSha": LEGACY_BLOBS[sid],
            "sha256": digest, "sizeBytes": size, "acquiredFrom": {"kind": "raw-file-at-pinned-source-commit",
                "url": f"https://raw.githubusercontent.com/LuceatLuxVestra42/langrisser-future-guide/{LEGACY}/public/images/skin-fullart/{sid}.webp",
                "httpStatus": 200, "bytes": size, "gitBlobSha": LEGACY_BLOBS[sid]}}
        assert source["legacyRenderStatus"] == render_status
        assert record["renderer"]["rendererCommit"] == "bccbdb564b3b2a70aeacfe6014f3829fdc7b09af"
        assert record["renderer"]["spineRuntimeVersion"] == "3.3.05"
        assert record["renderer"]["pose"] == {"animation": "idle_Normal", "timeSeconds": 0.0}
        output = record["output"]
        assert output["path"] == f"assets/skin-admissions/m06/skin-{sid}.webp"
        assert output["format"] == "image/webp" and output["dimensions"] == [width, height]
        assert output["sizeBytes"] == size and output["sha256"] == digest
        assert output["alpha"] == {"present": True, "transparentPixelsExist": True, "transparentPixelCount": transparent_count}
        visual = record["visualReview"]
        assert visual["status"] == "PASS" and visual["fullBodyVisible"] is True
        assert visual["cardFramePresent"] is False and visual["backgroundTransparent"] is True
        assert visual["aspectRatioPreserved"] is True and visual["sameBytesAsLegacyReference"] is True
        path = ROOT / output["path"]
        data = path.read_bytes()
        assert len(data) == size and hashlib.sha256(data).hexdigest() == digest, f"Skin {sid} byte integrity mismatch"
        assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", f"Skin {sid} invalid WebP signature"
        with Image.open(path) as image:
            image.load()
            assert image.format == "WEBP" and list(image.size) == [width, height]
            alpha = image.convert("RGBA").getchannel("A")
            assert alpha.getextrema()[0] == 0 and alpha.histogram()[0] == transparent_count
        matches = [r for r in asset_rows if r["skinId"] == sid]
        assert matches == [{"skinId": sid, "assetRecordSkinId": sid, "assetEvidence": manifest_path,
                            "admissionStatus": "APPROVED", "assetValidator": "tools/validate-skin-fullart-m06.py"}]

    print("M06 Skin Fullart Asset Admission (602-606): PASS (binary, SHA-256, decoder, dimensions, alpha, provenance, Registry parity)")


if __name__ == "__main__":
    validate()
