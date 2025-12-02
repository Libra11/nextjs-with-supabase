import crypto from "crypto";
import { NextResponse } from "next/server";

const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
const bucket = process.env.OSS_BUCKET;
const region = process.env.OSS_REGION;
const baseFolder = normalizeSegment(process.env.OSS_BASE_FOLDER || "libra_supabase_blog");
const maxSize = Number(process.env.OSS_UPLOAD_MAX_SIZE || 20 * 1024 * 1024); // 20MB 默认
const expireSeconds = Number(process.env.OSS_UPLOAD_EXPIRE_SECONDS || 60); // 1分钟默认

function normalizeSegment(value?: string) {
  if (!value) return "";
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}

export async function POST(request: Request) {
  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    return NextResponse.json(
      { error: "OSS 凭证未配置完整" },
      { status: 500 }
    );
  }

  let body: { folder?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const folder = normalizeSegment(body.folder);
  const dirParts = [baseFolder, folder].filter(Boolean);
  const dir = dirParts.length ? `${dirParts.join("/")}/` : "";

  const host = `https://${bucket}.${region}.aliyuncs.com`;
  const expiration = new Date(Date.now() + expireSeconds * 1000).toISOString();
  const policyString = JSON.stringify({
    expiration,
    conditions: [
      ["content-length-range", 0, maxSize],
      ["starts-with", "$key", dir],
    ],
  });

  const policy = Buffer.from(policyString).toString("base64");
  const signature = crypto
    .createHmac("sha1", accessKeySecret)
    .update(policy)
    .digest("base64");

  return NextResponse.json({
    accessId: accessKeyId,
    host,
    dir,
    policy,
    signature,
    expire: expireSeconds,
    maxSize,
  });
}
