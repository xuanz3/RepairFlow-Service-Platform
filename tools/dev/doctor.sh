#!/bin/bash
set -Eeuo pipefail

required=(git node npm dotnet docker python3)
for tool in "${required[@]}"; do
  command -v "$tool" >/dev/null 2>&1 || { echo "Missing required tool: $tool" >&2; exit 1; }
done

echo "git: $(git --version)"
echo "node: $(node --version)"
echo "npm: $(npm --version)"
echo "dotnet: $(dotnet --version)"
echo "docker: $(docker --version | head -n 1)"
echo "python: $(python3 --version)"
