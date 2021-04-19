#!/bin/sh

# Runs the ESM compatibility tests only on Node 6 and higher

. ~/.nvm/nvm.sh

NODE_VERSION=$(nvm current)
echo "Using Node ${NODE_VERSION} in tests"

MAJOR_VERSION=`echo $NODE_VERSION | sed -E 's/v([0-9]+)\.[0-9]+\.[0-9]+/\1/'`
if [ "$MAJOR_VERSION" -ge "6" ]; then
  echo "Node major version ${MAJOR_VERSION} supports ESM"
  mocha --require esm --reporter spec --bail --check-leaks --ui qunit test/
else
  echo "Node major version ${MAJOR_VERSION} does not support ESM"
  # Even if you tell Mocha to exclude this test it will still import it and choke so we remove it
  rm test/esm.js
  mocha --reporter spec --bail --check-leaks --ui qunit test/
fi
