#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILL_NAME="$(basename "${SKILL_DIR}")"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
TARGET_DIR="${CODEX_HOME_DIR}/skills"
TARGET_PATH="${TARGET_DIR}/${SKILL_NAME}"

if [[ "${1:-}" == "--dry-run" ]]; then
  printf 'skill_dir=%s\n' "${SKILL_DIR}"
  printf 'target_path=%s\n' "${TARGET_PATH}"
  exit 0
fi

mkdir -p "${TARGET_DIR}"

if [[ -L "${TARGET_PATH}" ]]; then
  CURRENT_TARGET="$(readlink "${TARGET_PATH}")"
  if [[ "${CURRENT_TARGET}" == "${SKILL_DIR}" ]]; then
    printf 'Skill already linked at %s\n' "${TARGET_PATH}"
    exit 0
  fi
  printf 'Refusing to replace existing symlink: %s -> %s\n' "${TARGET_PATH}" "${CURRENT_TARGET}" >&2
  exit 1
fi

if [[ -e "${TARGET_PATH}" ]]; then
  printf 'Refusing to replace existing path: %s\n' "${TARGET_PATH}" >&2
  exit 1
fi

ln -s "${SKILL_DIR}" "${TARGET_PATH}"
printf 'Linked %s -> %s\n' "${TARGET_PATH}" "${SKILL_DIR}"
