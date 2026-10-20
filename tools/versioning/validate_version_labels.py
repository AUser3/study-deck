#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

VALID_VERSION_LABELS = {"major", "minor", "patch"}


def validate_exactly_one_version_label(labels: list[str]) -> str:
    selected = [label for label in labels if label in VALID_VERSION_LABELS]
    if len(selected) != 1:
        raise ValueError(
            "Pull requests must have exactly one version label "
            f"(major, minor, patch). Found: {len(selected)}."
        )
    return selected[0]


def labels_from_event(event: dict[str, Any]) -> list[str]:
    pull_request = event.get("pull_request")
    if not isinstance(pull_request, dict):
        return []
    labels = pull_request.get("labels", [])
    if not isinstance(labels, list):
        return []
    return [
        label["name"]
        for label in labels
        if isinstance(label, dict) and isinstance(label.get("name"), str)
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--event-file", required=True)
    args = parser.parse_args()
    event = json.loads(Path(args.event_file).read_text(encoding="utf-8"))
    try:
        print(validate_exactly_one_version_label(labels_from_event(event)))
    except ValueError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
