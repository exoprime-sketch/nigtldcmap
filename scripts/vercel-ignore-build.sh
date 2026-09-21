#!/usr/bin/env bash
# Vercel `ignoreCommand` (vercel.json). Exit 0 cancels the build; any other
# exit code builds. The body lives here because Vercel caps the inline command
# at 256 characters. Semantics are verified by
# scripts/v140/verify-ignore-command-v140.mjs, which replays this file.
#
# Only an unchanged Preview is skipped: Production, a missing previous
# deployment and an unknown environment always build.
[ "$VERCEL_ENV" = "preview" ] || exit 1
[ -n "$VERCEL_GIT_PREVIOUS_SHA" ] || exit 1
git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- public src api server scripts/v149 package.json package-lock.json tsconfig.json .eslintrc.json .gitattributes vercel.json '.env*'
