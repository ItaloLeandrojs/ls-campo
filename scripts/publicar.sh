#!/usr/bin/env bash
# Gera o site e publica na branch gh-pages (GitHub Pages lê dela).
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
MSYS_NO_PATHCONV=1 BASE=/ls-campo/ npm run build
npm run termos
grep -q 'canonical" href="https://italoleandrojs.github.io/ls-campo/' dist/index.html || { echo "Base errada no build"; exit 1; }
touch dist/.nojekyll
TMP=$(mktemp -d)
cp -r dist/. "$TMP/"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="Italo Leandro" -c user.email="italols.js@gmail.com" commit -q -m "Publicação $(date +%Y-%m-%d\ %H:%M)"
git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -q -f https://github.com/ItaloLeandrojs/ls-campo.git gh-pages
echo "Publicado em https://italoleandrojs.github.io/ls-campo/"
