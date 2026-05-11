fetch("http://localhost:3000/api/storage/presign-upload", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ filename: "test.json", contentType: "application/json" })
})
.then(res => res.json())
.then(async data => {
  console.log("Presigned URL:", data.url);
  const putRes = await fetch(data.url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hello: "world" })
  });
  console.log("PUT status:", putRes.status, await putRes.text());
})
.catch(console.error);
