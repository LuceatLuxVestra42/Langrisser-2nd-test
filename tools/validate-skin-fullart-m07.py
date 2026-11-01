#!/usr/bin/env python3
"""Independent private Asset Admission validation for Skin 3701."""
import hashlib
import json
import os
import stat
from pathlib import Path

from PIL import Image

ROOT = Path(os.environ.get("M07_ASSET_ROOT", Path(__file__).resolve().parents[1])).resolve()
EVIDENCE = "evidence/assets/skin-fullart-m07.v1.json"
ASSET = "assets/skin-admissions/m07/skin-3701.webp"
REGISTRY = "canonical/skin-asset-registry-m05-g.v1.json"
SEMANTIC_REGISTRY = "canonical/skin-admission-registry-m05-g.v1.json"
PUBLICATION = "canonical/skin-publication-approvals-m05-g.v1.json"
PUBLIC_CONSUMER = "generated/skin-consumer-public-m05-g.v1.json"
PUBLIC_ASSETS = "generated/skin-assets-public-m05-g.v1.json"
PNG_SHA256 = "a2c6f42a38effe45f506081d6c82dce36ecec8ff1cd119deedf278bdab64127d"
WEBP_SHA256 = "c3307ee65ab66a0a47b527c54b508103629ad53203b08fd66e6ee52553965987"
WEBP_BYTES = 451082
DIMENSIONS = [898, 1081]
TRANSPARENT_PIXELS = 512151
LEGACY_MAIN = "57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff"
RUN_COMMIT = "9aa141fd54bbbed13b95bf5f2f918e0ec2e65158"
WORKFLOW_BLOB = "bd78866742371fa77ed82a6d32598c663726e022"
SOURCE_MANIFEST_BLOB = "259c9e8f2ef72ff61a9551c233f6041d509cc563"
ARTIFACT_SHA256 = "0277d38e881b6da04046d4cd7edf786546d508d8f795b52fe70e988e6e3fce7d"


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def exactly_one(rows, predicate, label):
    matches = [row for row in rows if predicate(row)]
    assert len(matches) == 1, f"{label}: expected exactly one record, found {len(matches)}"
    return matches[0]


def validate():
    evidence = read_json(EVIDENCE)
    assert evidence["schemaVersion"] == 1
    assert evidence["scope"] == "Skin 3701 Fullart Asset Admission; distinct from any Publication Approval or public delivery."
    sem_registry = read_json(SEMANTIC_REGISTRY)
    sem_admission = exactly_one(sem_registry["admissions"], lambda r: r.get("skinId") == 3701, "Semantic Admission")
    assert sem_admission["admissionId"] == "M07-SKIN-3701" and sem_admission["status"] == "APPROVED"
    assert sem_admission["identityCanonical"] == "canonical/skin-identities-3701.v1.json"
    assert sem_admission["relationCanonical"] == "canonical/skin-hero-relations-3701.v1.json"
    assert sem_admission["orderCanonical"] == "canonical/skin-source-orders-3701.v1.json"

    identity = exactly_one(read_json("canonical/skin-identities-3701.v1.json")["records"],
                           lambda r: r.get("skinId") == 3701, "Skin identity")
    relation = exactly_one(read_json("canonical/skin-hero-relations-3701.v1.json")["records"],
                           lambda r: r.get("skinId") == 3701, "Hero relation")
    order = exactly_one(read_json("canonical/skin-source-orders-3701.v1.json")["records"],
                        lambda r: r.get("skinId") == 3701, "Source Order")
    assert relation["heroId"] == 37 and order["sourceOrder"] == 1

    semantic_owner = evidence["semanticOwner"]
    assert semantic_owner == {
        "admission": "canonical/skin-admission-registry-m05-g.v1.json#admissions/M07-SKIN-3701",
        "identity": "canonical/skin-identities-3701.v1.json#records/skinId=3701",
        "relation": "canonical/skin-hero-relations-3701.v1.json#records/skinId=3701",
        "order": "canonical/skin-source-orders-3701.v1.json#records/skinId=3701",
        "kind": "reference-only",
    }

    source = evidence["records"]
    record = exactly_one(source, lambda r: r.get("skinId") == 3701, "Asset Evidence")
    assert len(source) == 1
    assert record["semanticReference"] == {"admission": "M07-SKIN-3701", "heroId": 37, "sourceOrder": 1}
    assert record["assetKind"] == "skin-spine-fullart"
    authority = record["source"]
    assert authority["repository"] == "LuceatLuxVestra42/langrisser-future-guide"
    assert authority["sourceMainCommit"] == LEGACY_MAIN
    assert authority["sourceEvidencePath"] == "data/evidence/skin-stage3-2-asset-resolution-evidence.v1.json"
    assert authority["sourceEvidenceGitBlobSha"] == SOURCE_MANIFEST_BLOB
    assert authority["installVersion"] == "1.1.113"
    assert authority["officialSourceRef"] == (
        "official-install://1.1.113/InstallPage_1.1.113_45.zip/PC/AssetBundle/"
        "spine_char_zigodlla_abs.b#assets/gameproject/runtimeassets/spine/char/"
        "zigodlla_abs/zigodlla_skin01_prefab.prefab"
    )
    assert authority["prefabLocator"] == "Spine/Char/Zigodlla_ABS/Zigodlla_Skin01_Prefab.prefab"
    assert authority["resolvedPrefabPath"] == "assets/gameproject/runtimeassets/spine/char/zigodlla_abs/zigodlla_skin01_prefab.prefab"
    assert authority["bundle"] == {
        "name": "spine_char_zigodlla_abs.b",
        "installerPackage": "InstallPage_1.1.113_45.zip",
        "sizeBytes": None,
        "sha256": None,
        "integrityStatus": "NOT_VERIFIED",
    }
    chain = authority["resolvedRenderInputs"]
    assert chain["spineVersion"] == "3.3.05"
    assert chain["atlas"] == {"runtimePath": "assets/gameproject/runtimeassets/spine/char/zigodlla_abs/zigodlla_skin01.atlas.txt",
                              "sizeBytes": 9012, "sha256": "7015ca22aee890abe0d6fb9f863f1562fbc6bb932d3f62eeae59b5c96939f7be"}
    assert chain["skeleton"] == {"runtimePath": "assets/gameproject/runtimeassets/spine/char/zigodlla_abs/zigodlla_skin01.skel.bytes",
                                 "sizeBytes": 208681, "sha256": "6c6091552bc53a8ca4e83bea650de5dd2d39ef5bf850915346991478808c9c9b"}
    assert chain["texture"] == {"runtimePath": "assets/gameproject/runtimeassets/spine/char/zigodlla_abs/zigodlla_skin01.png",
                                "sizeBytes": 1260638, "sha256": "8ced279126446c3ef911d27c57707220be01d7e25abc5fc5085543d9be83e885",
                                "dimensions": [2048, 1024]}

    render = record["render"]
    assert render["runId"] == 33516153818
    assert render["repository"] == "LuceatLuxVestra42/langrisser-future-guide"
    assert render["headBranch"] == "work/skin-fullart-representative-crosscheck-20260901"
    assert render["headCommit"] == RUN_COMMIT
    assert render["job"] == "crosscheck (3701)"
    assert render["workflowPath"] == ".github/workflows/skin-fullart-representative-crosscheck.yml"
    assert render["workflowBlobSha"] == WORKFLOW_BLOB
    assert render["artifact"] == {
        "artifactId": 9803689710, "name": "skin-fullart-representative-3701", "sizeBytes": 714193,
        "digest": f"sha256:{ARTIFACT_SHA256}"
    }
    assert render["renderer"] == {
        "repository": "EsotericSoftware/spine-runtimes", "commit": "1c1936532527900f74cfb58f7002998bf157b254",
        "spineVersion": "3.3.05", "pose": {"animation": "idle_Normal", "timeSeconds": 0}
    }
    assert render["result"] == {
        "status": "PASS_CURRENT_SPINE_CHAR_IDLE_RENDER", "pngPath": "char.png", "pngSha256": PNG_SHA256,
        "pngSizeBytes": 685927, "dimensions": DIMENSIONS, "alphaBBox": [24, 24, 873, 1057],
        "renderables": 51, "triangles": 824
    }

    conversion = record["conversion"]
    assert conversion == {
        "inputPngSha256": PNG_SHA256, "inputPngSizeBytes": 685927,
        "tool": "Pillow Image.save", "pillowVersion": "12.3.0", "libwebpVersion": "1.6.0",
        "options": {"format": "WEBP", "lossless": True, "quality": 100, "method": 6, "exact": True},
        "decodedPixelsExactlyMatchInputPng": True
    }
    output = record["output"]
    assert output == {
        "path": ASSET, "format": "image/webp", "dimensions": DIMENSIONS,
        "sizeBytes": WEBP_BYTES, "sha256": WEBP_SHA256,
        "alpha": {"present": True, "transparentPixelsExist": True, "transparentPixelCount": TRANSPARENT_PIXELS}
    }
    review = record["visualReview"]
    assert review == {
        "status": "PASS", "reviewMethod": "direct visual inspection of decoded lossless WebP",
        "fullBodyVisible": True, "cardFramePresent": False, "backgroundTransparent": True,
        "aspectRatioPreserved": True, "pixelExactAgainstVerifiedPng": True
    }

    asset_registry = read_json(REGISTRY)
    assert asset_registry["schemaVersion"] == 1
    rows = asset_registry["records"]
    matches = [r for r in rows if r.get("skinId") == 3701]
    assert matches == [{
        "skinId": 3701, "assetRecordSkinId": 3701, "assetEvidence": EVIDENCE,
        "admissionStatus": "APPROVED", "assetValidator": "tools/validate-skin-fullart-m07.py"
    }]
    assert len({r["skinId"] for r in rows}) == len(rows), "duplicate Asset Registry SkinID"
    approved_ids = {r["skinId"] for r in rows if r["admissionStatus"] == "APPROVED"}
    assert {102, 103, 104, 105, 601, 602, 603, 604, 605, 606, 3701}.issubset(approved_ids)


    asset_path = ROOT / ASSET
    st = asset_path.lstat()
    assert stat.S_ISREG(st.st_mode), "Asset must be a regular, non-symlink file"
    data = asset_path.read_bytes()
    assert len(data) == WEBP_BYTES and hashlib.sha256(data).hexdigest() == WEBP_SHA256
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", "invalid WebP signature"
    with Image.open(asset_path) as image:
        image.load()
        assert image.format == "WEBP" and list(image.size) == DIMENSIONS
        alpha = image.convert("RGBA").getchannel("A")
        assert alpha.getextrema()[0] == 0 and alpha.histogram()[0] == TRANSPARENT_PIXELS
    print("M07 Skin 3701 private Fullart Asset Admission: PASS (Semantic FK, Source→Run→PNG→WebP provenance, hash, WebP decode, dimensions, alpha, private/public boundary)")


if __name__ == "__main__":
    validate()
