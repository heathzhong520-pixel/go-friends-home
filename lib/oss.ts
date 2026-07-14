import OSS from "ali-oss";

export function signedDownloadUrl(objectKey: string, filename: string) {
  const client = new OSS({
    region: process.env.OSS_REGION ?? "oss-cn-guangzhou",
    accessKeyId: process.env.OSS_ACCESS_KEY_ID ?? "",
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET ?? "",
    bucket: process.env.OSS_BUCKET ?? "",
    secure: true,
  });
  if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET || !process.env.OSS_BUCKET) throw new Error("OSS is not configured");
  return client.signatureUrl(objectKey, { expires: 300, response: { "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}` } });
}
