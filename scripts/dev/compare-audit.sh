#!/usr/bin/env bash
# The fixed-seed audit identity check: after any change that touches the
# engine or content, the audit report must match the one built from a base
# ref (origin/main by default), unless the change is meant to alter play.
#
# Usage: scripts/dev/compare-audit.sh <scratch dir> [base ref]
set -e
S=$1; BASE=${2:-origin/main}; REPO=$(pwd)
[ -n "$S" ] || { echo "usage: $0 <scratch dir> [base ref]"; exit 2; }
mkdir -p "$S"
rm -rf "$S/base-wt"; git worktree add -q "$S/base-wt" "$BASE"; ln -s "$REPO/node_modules" "$S/base-wt/node_modules"
(cd "$S/base-wt" && timeout 300 npx tsx scripts/generate-audit-report.ts --runs 20 --seed fixed-seed >/dev/null 2>&1 && cp docs-site/public/data/audit-report.json "$S/audit-base.json")
timeout 300 npx tsx scripts/generate-audit-report.ts --runs 20 --seed fixed-seed >/dev/null 2>&1 && cp docs-site/public/data/audit-report.json "$S/audit-branch.json"
git worktree remove --force "$S/base-wt"
node -e "const a=require('$S/audit-base.json'),b=require('$S/audit-branch.json');const strip=o=>JSON.stringify(o,(k,v)=>/generated_at|timestamp|duration/i.test(k)?undefined:v);const same=strip(a)===strip(b);console.log('audit report identical to $BASE:',same);process.exit(same?0:1)"
