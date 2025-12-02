type OssPolicyResponse = {
  accessId: string;
  host: string;
  dir: string;
  policy: string;
  signature: string;
};

type UploadOptions = {
  folder?: string;
  fileName?: string;
};

const sanitizeName = (input: string) =>
  input.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 60);

export async function uploadToOSS(file: File, options?: UploadOptions) {
  const response = await fetch("/api/oss/policy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: options?.folder || "" }),
  });

  if (!response.ok) {
    throw new Error("获取上传凭证失败");
  }

  const creds = (await response.json()) as OssPolicyResponse;
  const rawExt = file.name.includes(".")
    ? file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "")
    : "";
  const ext = rawExt ? `.${rawExt}` : "";
  const fallbackName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const baseName = options?.fileName || fallbackName;
  const safeName = sanitizeName(baseName) || fallbackName;
  const key = `${creds.dir}${safeName}${ext}`.replace(/\/{2,}/g, "/");

  const formData = new FormData();
  formData.append("key", key);
  formData.append("policy", creds.policy);
  formData.append("OSSAccessKeyId", creds.accessId);
  formData.append("success_action_status", "200");
  formData.append("signature", creds.signature);
  formData.append("file", file);

  const uploadResult = await fetch(creds.host, {
    method: "POST",
    body: formData,
  });

  if (!uploadResult.ok) {
    const errorText = await uploadResult.text().catch(() => "OSS 上传失败");
    throw new Error(errorText || "OSS 上传失败");
  }

  return {
    url: `${creds.host}/${key}`,
    key,
  };
}
