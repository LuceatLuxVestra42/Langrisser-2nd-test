#!/usr/bin/env python3
"""Validate M04 Skin Spine fullart assets against their source manifest."""

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


IDS = [102, 103, 104, 105]
LOCATORS = {
    102: "Spine/Char/Mathew_ABS/Mathew_Skin01_Prefab.prefab",
    103: "Spine/Char/Mathew_ABS/Mathew_Skin02_Prefab.prefab",
    104: "Spine/Char/Mathew_ABS/Mathew_Skin03_Prefab.prefab",
    105: "Spine/Char/Mathew_ABS/Mathew_Skin04_Prefab.prefab",
}
PREFAB_SHA256 = {
    102: "c8e2326b534376e0f2edba4b73dda9ee9d5350f88fb844edb188b835e3220532",
    103: "7ad64b26709b643b5fde64808eb7e0c793c5c66e5f3c26a1448fd7a37d240774",
    104: "cc521729ae6e26f4eb00aa6da3fd7841ed53e84766dc54d44bd52809c047ab44",
    105: "7e61fbfb988ba6832269899722c666bb18019277b879231211c98609e6182d6a",
}
CONTAINER_PATHS = {
    skin_id: f"assets/gameproject/runtimeassets/spine/char/mathew_abs/mathew_skin0{skin_id - 101}_prefab.prefab"
    for skin_id in IDS
}
PACKAGE_SHA256 = "2d2aceb0c5f3b53742e794cc2e37784f3d07814c935093dc4e631d2c72b65740"
BUNDLE_SHA256 = "8d2525638331fe5b0e4af8801e32548a11d29de717d52cdf0471a0590b6cc5d3"
RUNTIME_COMMIT = "1c1936532527900f74cfb58f7002998bf157b254"
INVENTORY_BLOB = "a5713e1f9574013b124033bbe70c7e8201b910cd"
GEOMETRY_RENDERER_SHA256 = "b5819e3926a93951361ad06044f5dce2a21c4c7096c8885368bf3608d14fee24"
SPINE_GEOMETRY_SHA256 = "9c6aa74e5c6adb745e6da8cae8b3b7cb1e3b9a170b5909a9ea4d5f46ea3bc29b"
RUNTIME_ARCHIVE_SHA256 = "15a7765995f04f76acd197ad45165c7b99442d39a90b99556851518b2effd9b4"


class ValidationError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise ValidationError(message)


def exact_keys(value, expected, label):
    require(isinstance(value, dict), f"{label}: object required")
    require(set(value) == set(expected), f"{label}: fields drift")


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ValidationError(f"cannot read JSON {path}: {exc}") from exc


def validate(root):
    root = Path(root)
    manifest_path = root / "evidence/assets/skin-fullart-m04.v1.json"
    manifest = load_json(manifest_path)
    exact_keys(manifest, [
        "schemaVersion", "scope", "semanticOwner", "assetSourceAuthority",
        "limitations", "records",
    ], "M04 Asset Manifest")
    require(manifest["schemaVersion"] == 1, "M04 Asset Manifest: schema version drift")
    require(manifest["scope"] == (
        "Four Spine fullart assets for Skin IDs 102-105; assets only; not semantic authority, presentation approval, or publication approval."
    ), "M04 Asset Manifest: scope drift")
    require(manifest["semanticOwner"] == {
        "kind": "reference-only", "path": "generated/skin-consumer.v1.json",
        "authority": "M01-M03 canonical owners",
    }, "M04 Asset Manifest: semantic owner must remain a reference")
    require(manifest["assetSourceAuthority"] == {
        "repository": "LuceatLuxVestra42/langrisser-future-guide",
        "kind": "official-unity-client-asset-source", "installVersion": "1.1.113",
    }, "M04 Asset Manifest: Asset Source authority drift")
    require(manifest["limitations"] == [
        "Original game build number was not established.",
        "The ConfigData Semantic Snapshot and Unity client Asset Source version are independent provenance streams.",
        "Source is a fixed historical official installer package; it does not imply current or future game population.",
        "Skin 105 decorative typography belongs to the rendered Spine artwork.",
    ], "M04 Asset Manifest: required limitations missing or changed")

    consumer = load_json(root / "generated/skin-consumer.v1.json")
    require(set(consumer) == {"schemaVersion", "skins"} and consumer["schemaVersion"] == 1,
            "M03 Generated Consumer: schema drift")
    require([row.get("skinId") for row in consumer.get("skins", [])] == IDS,
            "M03 Generated Consumer: Skin population drift")
    semantic = {row["skinId"]: row for row in consumer["skins"]}

    records = manifest["records"]
    require(isinstance(records, list), "M04 Asset Manifest: records array required")
    ids = [row.get("skinId") if isinstance(row, dict) else None for row in records]
    require(ids == IDS, "M04 Asset Manifest: duplicate, missing, extra, or unordered SkinID")

    skin_dir = root / "assets/skins"
    actual_files = sorted(p.relative_to(root).as_posix() for p in skin_dir.glob("*") if p.is_file())
    expected_files = [f"assets/skins/skin-{skin_id}.webp" for skin_id in IDS]
    require(actual_files == expected_files, "M04 Asset files: unexpected, duplicate, or missing path")

    output_hashes = set()
    for row in records:
        skin_id = row["skinId"]
        label = f"Skin {skin_id}"
        exact_keys(row, [
            "skinId", "semanticReference", "assetKind", "source", "renderer",
            "output", "visualReview",
        ], label)
        require(row["semanticReference"] == {
            "generatedConsumer": "generated/skin-consumer.v1.json",
            "heroId": semantic[skin_id]["heroId"],
            "sourceOrder": semantic[skin_id]["sourceOrder"],
        }, f"{label}: M03 semantic reference drift")
        require(row["assetKind"] == "skin-spine-fullart", f"{label}: card asset is not Fullart")

        source = row["source"]
        exact_keys(source, [
            "repository", "sourceMainCommit", "locatorEvidence", "installationPackage",
            "bundle", "runtimePrefab", "skeletonAnimation", "skeletonData", "atlas",
        ], f"{label} Source")
        require(source["repository"] == "LuceatLuxVestra42/langrisser-future-guide",
                f"{label}: Source Repository drift")
        require(source["sourceMainCommit"] == "57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff",
                f"{label}: Source ref drift")
        require(source["locatorEvidence"] == {
            "path": "data/generated/skin-stage3-1-asset-inventory.v1.json",
            "gitBlobSha": INVENTORY_BLOB, "frozenLocator": LOCATORS[skin_id],
        }, f"{label}: frozen Locator evidence drift")
        require(source["installationPackage"] == {
            "kind": "official-installer", "version": "1.1.113",
            "package": "InstallPage_1.1.113_25.zip", "sizeBytes": 113075694,
            "sha256": PACKAGE_SHA256,
            "url": "http://mhmnzupdate.zlongame.com/MHMNZ/InstallVersion/InstallPage_1.1.113/InstallPage_1.1.113_25.zip",
        }, f"{label}: installation package provenance drift")
        require(source["bundle"] == {
            "name": "begin_spine_char_mathew_abs.b",
            "archivePath": "Client/Langrisser_Data/StreamingAssets/ExportAssetBundle/begin_spine_char_mathew_abs.b",
            "sizeBytes": 4651863, "sha256": BUNDLE_SHA256,
        }, f"{label}: source Bundle provenance drift")
        prefab = source["runtimePrefab"]
        exact_keys(prefab, ["containerPath", "objectType", "pathId", "serializedBytes", "sha256"],
                   f"{label} Prefab")
        require(prefab["containerPath"] == CONTAINER_PATHS[skin_id]
                and prefab["objectType"] == "GameObject"
                and prefab["serializedBytes"] == 83
                and prefab["sha256"] == PREFAB_SHA256[skin_id],
                f"{label}: exact Prefab mismatch")
        require(isinstance(prefab["pathId"], int) and prefab["pathId"] != 0,
                f"{label}: Prefab Object not acquired")

        animation = source["skeletonAnimation"]
        require(animation.get("objectType") == "MonoBehaviour"
                and animation.get("prefabConfiguredAnimation") == "idle_Normal"
                and animation.get("initialSkin") == "default"
                and animation.get("skeletonDataAssetPathId") == source["skeletonData"].get("pathId"),
                f"{label}: Prefab to SkeletonData PPtr chain invalid")
        skeleton = source["skeletonData"]
        require(skeleton.get("objectType") == "MonoBehaviour"
                and skeleton.get("spineVersion") == "3.3.05"
                and skeleton.get("sizeBytes", 0) > 0
                and len(skeleton.get("sha256", "")) == 64,
                f"{label}: Skeleton dependency missing or invalid")
        atlas = source["atlas"]
        require(isinstance(atlas, dict)
                and all(atlas.get(key) not in (None, "", 0) for key in [
                    "atlasAssetPathId", "textAssetPathId", "textAssetName", "sizeBytes",
                    "sha256", "materialPathId", "textureObjectPathId", "textureName",
                    "textureDimensions", "exportedTexturePngSha256",
                ])
                and len(atlas["sha256"]) == 64
                and len(atlas["exportedTexturePngSha256"]) == 64,
                f"{label}: Atlas, Material, or Texture dependency missing")

        renderer = row["renderer"]
        require(renderer.get("rendererSourceCommit") == "ab1bed2c"
                and renderer.get("spineRuntimeCommit") == RUNTIME_COMMIT
                and renderer.get("spineRuntimeVersion") == "3.3.05"
                and renderer.get("unityPyVersion") == "1.25.3"
                and renderer.get("pose") == {"animation": "idle_Normal", "timeSeconds": 0.0}
                and renderer.get("renderStatus") == "FULLART_RENDER_PASS",
                f"{label}: render gate not passed or Renderer provenance drift")
        geom = renderer.get("geometry", {})
        require(geom.get("renderableAttachmentCount", 0) > 0
                and geom.get("triangleCount", 0) > 0
                and isinstance(geom.get("alphaBoundingBox"), dict),
                f"{label}: no renderable Spine geometry proof")
        require(len(renderer.get("geometryRendererSha256", "")) == 64
                and len(renderer.get("spineGeometrySourceSha256", "")) == 64
                and len(renderer.get("spineRuntimeArchiveSha256", "")) == 64,
                f"{label}: Renderer source hashes missing")
        require(renderer["geometryRendererSha256"] == GEOMETRY_RENDERER_SHA256
                and renderer["spineGeometrySourceSha256"] == SPINE_GEOMETRY_SHA256
                and renderer["spineRuntimeArchiveSha256"] == RUNTIME_ARCHIVE_SHA256,
                f"{label}: Renderer source digest drift")

        output = row["output"]
        expected_path = f"assets/skins/skin-{skin_id}.webp"
        exact_keys(output, ["path", "format", "dimensions", "alpha", "sizeBytes", "sha256", "encoder"],
                   f"{label} Output")
        require(output["path"] == expected_path and output["format"] == "image/webp",
                f"{label}: invalid output path or format")
        image_path = root / expected_path
        try:
            with Image.open(image_path) as probe:
                require(probe.format == "WEBP", f"{label}: file is not WebP")
                probe.verify()
            with Image.open(image_path) as opened:
                image = opened.convert("RGBA")
                width, height = image.size
                alpha_extrema = list(image.getchannel("A").getextrema())
        except Exception as exc:
            raise ValidationError(f"{label}: invalid image: {exc}") from exc
        data = image_path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        require([width, height] == output["dimensions"]
                and max(width, height) <= 1600
                and width > 0 and height > 0,
                f"{label}: invalid output dimensions")
        require(alpha_extrema == [0, 255]
                and output["alpha"] == {
                    "present": True, "extrema": [0, 255], "transparentPixelsExist": True,
                }, f"{label}: transparent alpha channel missing or flattened")
        require(len(data) == output["sizeBytes"] and digest == output["sha256"],
                f"{label}: output size or SHA-256 mismatch")
        require(digest not in output_hashes, f"{label}: duplicate asset bytes used for multiple Skins")
        output_hashes.add(digest)
        require(output["encoder"] == {
            "Pillow": "13.0.0", "quality": 90, "method": 6, "maxDimension": 1600,
        }, f"{label}: output encoding contract drift")
        review = row["visualReview"]
        require(review == {
            "status": "PASS", "reviewMethod": "direct rendered output inspection",
            "fullBodyVisible": True, "cardFramePresent": False,
            "backgroundTransparent": True, "missingMajorAttachmentsObserved": False,
        }, f"{label}: visual review is incomplete")
    return len(records)


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    count = validate(root)
    print(f"PASS: M04 Skin fullart Assets ({count} SkinIDs; source, render, alpha, and output integrity)")


if __name__ == "__main__":
    try:
        main()
    except ValidationError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
