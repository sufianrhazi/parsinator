#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
exec node_modules/.bin/browserify build/tsc/main.js -o build/bundle.js