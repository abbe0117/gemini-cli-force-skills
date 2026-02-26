#!/bin/bash
set -e

echo "Building isolated test container..."
docker buildx build -f Dockerfile.test -t gemini-hook-test .

echo "Container built and verification passed successfully."