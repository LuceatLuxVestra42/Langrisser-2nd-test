#!/usr/bin/env python3
"""Negative tests for the M04 Skin Fullart Asset validator."""

import copy
import hashlib
import importlib.util
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location(
    "validate_skin_fullart_m04", ROOT / "tools/validate-skin-fullart-m04.py"
)
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)
MANIFEST = "evidence/assets/skin-fullart-m04.v1.json"


class SkinFullartM04Tests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory(prefix="skin-fullart-m04-")
        self.root = Path(self.temp_dir.name)
        (self.root / "evidence/assets").mkdir(parents=True)
        (self.root / "assets/skins").mkdir(parents=True)
        shutil.copy2(ROOT / "generated/skin-consumer.v1.json",
                     self.root / "generated-skin-consumer.v1.json")
        # Validator path is fixed by repository contract, so keep generated under its expected directory.
        (self.root / "generated").mkdir()
        shutil.move(self.root / "generated-skin-consumer.v1.json",
                    self.root / "generated/skin-consumer.v1.json")
        shutil.copy2(ROOT / MANIFEST, self.root / MANIFEST)
        for skin_id in [102, 103, 104, 105]:
            shutil.copy2(ROOT / f"assets/skins/skin-{skin_id}.webp",
                         self.root / f"assets/skins/skin-{skin_id}.webp")
        self.baseline = json.loads((self.root / MANIFEST).read_text(encoding="utf-8"))

    def tearDown(self):
        self.temp_dir.cleanup()

    def save_manifest(self, value):
        (self.root / MANIFEST).write_text(
            json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    def expect_failure(self, mutate, message):
        value = copy.deepcopy(self.baseline)
        mutate(value)
        self.save_manifest(value)
        with self.assertRaisesRegex(VALIDATOR.ValidationError, message):
            VALIDATOR.validate(self.root)

    def test_valid_assets_pass(self):
        self.assertEqual(VALIDATOR.validate(self.root), 4)

    def test_missing_skin_record_rejected(self):
        self.expect_failure(lambda m: m["records"].pop(), "SkinID")

    def test_duplicate_skin_record_rejected(self):
        self.expect_failure(lambda m: m["records"][1].update(skinId=102), "SkinID")

    def test_extra_skin_record_rejected(self):
        self.expect_failure(lambda m: m["records"].append(copy.deepcopy(m["records"][0])), "SkinID")

    def test_wrong_frozen_locator_rejected(self):
        self.expect_failure(lambda m: m["records"][0]["source"]["locatorEvidence"].update(
            frozenLocator="Spine/Char/Mathew_ABS/Mathew_Skin01_Range_Prefab.prefab"
        ), "Locator")

    def test_wrong_prefab_hash_rejected(self):
        self.expect_failure(lambda m: m["records"][0]["source"]["runtimePrefab"].update(
            sha256="0" * 64
        ), "Prefab mismatch")

    def test_resolution_only_is_not_render_pass(self):
        self.expect_failure(lambda m: m["records"][0]["renderer"].update(
            renderStatus="LOCATOR_RESOLVED"
        ), "render gate")

    def test_missing_skeleton_dependency_rejected(self):
        self.expect_failure(lambda m: m["records"][0]["source"]["skeletonData"].update(
            sha256=""
        ), "Skeleton dependency")

    def test_missing_atlas_texture_dependency_rejected(self):
        self.expect_failure(lambda m: m["records"][0]["source"]["atlas"].update(
            textureObjectPathId=None
        ), "Atlas, Material, or Texture")

    def test_wrong_spine_runtime_rejected(self):
        self.expect_failure(lambda m: m["records"][0]["renderer"].update(
            spineRuntimeVersion="3.3.07"
        ), "Renderer provenance")

    def test_semantic_owner_reference_tamper_rejected(self):
        self.expect_failure(lambda m: m["records"][0]["semanticReference"].update(heroId=3),
                            "semantic reference")

    def test_asset_cannot_admit_card_art(self):
        self.expect_failure(lambda m: m["records"][0].update(assetKind="skin-card-png"),
                            "card asset")

    def test_unreviewed_visual_gate_rejected(self):
        self.expect_failure(lambda m: m["records"][0]["visualReview"].update(status="NOT_RUN"),
                            "visual review")

    def test_corrupt_webp_rejected(self):
        path = self.root / "assets/skins/skin-102.webp"
        path.write_bytes(b"RIFFbroken")
        with self.assertRaisesRegex(VALIDATOR.ValidationError, "invalid image"):
            VALIDATOR.validate(self.root)

    def test_alpha_loss_rejected_even_when_hash_is_updated(self):
        value = copy.deepcopy(self.baseline)
        path = self.root / "assets/skins/skin-102.webp"
        rgb_path = self.root / "flattened.webp"
        with Image.open(path) as image:
            image.convert("RGB").save(rgb_path, "WEBP", quality=90, method=6)
        data = rgb_path.read_bytes()
        path.write_bytes(data)
        row = value["records"][0]
        with Image.open(rgb_path) as image:
            dimensions = list(image.size)
        row["output"].update(
            sizeBytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
            dimensions=dimensions,
        )
        self.save_manifest(value)
        with self.assertRaisesRegex(VALIDATOR.ValidationError, "alpha channel"):
            VALIDATOR.validate(self.root)

    def test_changed_asset_hash_rejected(self):
        with (self.root / "assets/skins/skin-102.webp").open("ab") as stream:
            stream.write(b"tamper")
        with self.assertRaisesRegex(VALIDATOR.ValidationError, "invalid image|SHA-256"):
            VALIDATOR.validate(self.root)

    def test_same_asset_cannot_be_reused_for_another_skin(self):
        first = self.root / "assets/skins/skin-102.webp"
        second = self.root / "assets/skins/skin-103.webp"
        data = first.read_bytes()
        second.write_bytes(data)
        value = copy.deepcopy(self.baseline)
        row = value["records"][1]
        with Image.open(first) as image:
            dimensions = list(image.size)
        row["output"].update(
            sizeBytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
            dimensions=dimensions,
        )
        self.save_manifest(value)
        with self.assertRaisesRegex(VALIDATOR.ValidationError, "duplicate asset bytes"):
            VALIDATOR.validate(self.root)

    def test_unmanifested_asset_path_rejected(self):
        (self.root / "assets/skins/skin-999.webp").write_bytes(b"unapproved")
        with self.assertRaisesRegex(VALIDATOR.ValidationError, "unexpected, duplicate, or missing path"):
            VALIDATOR.validate(self.root)

    def test_prefab_acquisition_does_not_replace_render_gate(self):
        value = copy.deepcopy(self.baseline)
        value["records"][0]["renderer"]["renderStatus"] = "PREFAB_ACQUIRED"
        self.save_manifest(value)
        with self.assertRaisesRegex(VALIDATOR.ValidationError, "render gate"):
            VALIDATOR.validate(self.root)

    def test_asset_snapshot_cannot_be_promoted_to_semantic_owner(self):
        value = copy.deepcopy(self.baseline)
        value["semanticSnapshotVersion"] = "1.1.113"
        self.save_manifest(value)
        with self.assertRaisesRegex(VALIDATOR.ValidationError, "fields drift"):
            VALIDATOR.validate(self.root)


if __name__ == "__main__":
    unittest.main(verbosity=2)
