#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

VALID_VERSION_LABELS = {"major", "minor", "patch"}
VERSION_PATTERN = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def parse_version(version: str) -> tuple[int, int, int]:
    match = VERSION_PATTERN.match(version.strip())
    if not match:
        raise ValueError(f"Invalid semantic version: {version!r}")
    return tuple(int(part) for part in match.groups())


def bump_version(version: str, label: str) -> str:
    if label not in VALID_VERSION_LABELS:
        raise ValueError(f"Invalid version label: {label!r}")
    major, minor, patch = parse_version(version)
    if label == "major":
        return f"{major + 1}.0.0"
    if label == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def bump_version_file(version_file: Path, label: str) -> str:
    next_version = bump_version(version_file.read_text(encoding="utf-8"), label)
    version_file.write_text(f"{next_version}\n", encoding="utf-8")
    return next_version


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", required=True, choices=sorted(VALID_VERSION_LABELS))
    parser.add_argument("--version-file", default="VERSION")
    args = parser.parse_args()
    print(bump_version_file(Path(args.version_file), args.label))


if __name__ == "__main__":
    main()
