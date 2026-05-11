import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function onRequestDelete({ request, env }: { request: Request, env: any }) {
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

    const body: any = await request.json();
    const command = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME || "nexuschat",
      Key: body.filename,
    });
    
    await s3Client.send(command);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
