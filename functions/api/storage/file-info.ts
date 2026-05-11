import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function onRequestGet({ request, env }: { request: Request, env: any }) {
  try {
    const s3Client = new S3Client({
      forcePathStyle: true,
      region: "auto",
      endpoint: env.R2_ENDPOINT || "https://7b6b27d12265ebd16b19f2cf1577f778.r2.cloudflarestorage.com",
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: env.R2_SECRET_ACCESS_KEY || "",
      }
    });

    const command = new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME || "nexuschat" });
    const response = await s3Client.send(command);
    
    return new Response(JSON.stringify({ contents: response.Contents || [] }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
