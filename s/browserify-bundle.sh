#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
mkdir -p build/bundle/
for ENTRY_POINT in build/tsc/*.js; do
    BUNDLE="${ENTRY_POINT#build/tsc/}"
    node_modules/.bin/browserify "$ENTRY_POINT" -o "build/bundle/$BUNDLE"
done