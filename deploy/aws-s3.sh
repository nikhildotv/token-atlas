#!/usr/bin/env bash
# Deploy Token Atlas static site to an S3 website bucket.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
BUCKET="${AWS_S3_BUCKET:-}"
PROFILE_ARGS=()
if [[ -n "${AWS_PROFILE:-}" ]]; then
  PROFILE_ARGS=(--profile "$AWS_PROFILE")
fi

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

need aws
need python3

echo "Checking AWS identity..."
ACCOUNT_ID="$(aws "${PROFILE_ARGS[@]}" sts get-caller-identity --query Account --output text)"
echo "Account: $ACCOUNT_ID  Region: $REGION"

if [[ -z "$BUCKET" ]]; then
  BUCKET="token-atlas-${ACCOUNT_ID}-${REGION}"
fi
echo "Bucket: $BUCKET"

if aws "${PROFILE_ARGS[@]}" s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "Bucket already exists."
else
  echo "Creating bucket..."
  if [[ "$REGION" == "us-east-1" ]]; then
    aws "${PROFILE_ARGS[@]}" s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  else
    aws "${PROFILE_ARGS[@]}" s3api create-bucket \
      --bucket "$BUCKET" \
      --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=$REGION"
  fi
fi

echo "Configuring public website access..."
aws "${PROFILE_ARGS[@]}" s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws "${PROFILE_ARGS[@]}" s3api put-bucket-ownership-controls \
  --bucket "$BUCKET" \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerPreferred}]' 2>/dev/null || true

POLICY="$(python3 - <<PY
import json
print(json.dumps({
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": f"arn:aws:s3:::${BUCKET}/*"
  }]
}))
PY
)"
aws "${PROFILE_ARGS[@]}" s3api put-bucket-policy --bucket "$BUCKET" --policy "$POLICY"

aws "${PROFILE_ARGS[@]}" s3 website "s3://${BUCKET}/" \
  --index-document index.html \
  --error-document index.html

echo "Uploading site files..."
aws "${PROFILE_ARGS[@]}" s3 sync "$ROOT/" "s3://${BUCKET}/" \
  --delete \
  --exclude ".git/*" \
  --exclude "docs/*" \
  --exclude "deploy/*" \
  --exclude ".gitignore" \
  --exclude "README.md" \
  --cache-control "max-age=300"

if [[ "$REGION" == "us-east-1" ]]; then
  WEBSITE_URL="http://${BUCKET}.s3-website-us-east-1.amazonaws.com"
else
  WEBSITE_URL="http://${BUCKET}.s3-website-${REGION}.amazonaws.com"
fi

echo
echo "Deployed Token Atlas"
echo "  Bucket:  s3://${BUCKET}"
echo "  Website: ${WEBSITE_URL}"
echo "$WEBSITE_URL" > "$ROOT/deploy/last-deploy-url.txt"
echo "$BUCKET" > "$ROOT/deploy/last-bucket.txt"
