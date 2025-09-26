import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { S3Client, PutObjectCommand, CopyObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 환경변수에서 AWS 자격증명 로드
const REGION = "ap-northeast-2";
const BUCKET = "xromeda-docs";

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  throw new Error("Missing AWS credentials: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.");
}

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. Draft 업로드용 Presigned URL 발급
app.post("/api/get-presigned-url", async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ error: "docId required" });

    const Key = `docs/${docId}/drafts/current.json`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key,
      ContentType: "application/json",
      CacheControl: "no-store", // Draft는 항상 최신
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5분 유효
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

// 2. Draft → Release 배포 + manifest 갱신
app.post("/api/publish", async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ error: "docId required" });

    const draftKey = `docs/${docId}/drafts/current.json`;
    const manifestKey = `docs/${docId}/manifest.json`;

    // 2-1. 현재 manifest.json 불러오기
    let latest = "0000";
    try {
      const resp = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: manifestKey }));
      const text = await resp.Body.transformToString();
      const manifest = JSON.parse(text);
      latest = manifest.latest;
    } catch (e) {
      console.log("No manifest found, starting fresh");
    }

    // 2-2. 새 버전 번호 생성
    const next = String(parseInt(latest, 10) + 1).padStart(4, "0");
    const releaseKey = `docs/${docId}/releases/${next}.json`;

    // 2-3. Draft → Release 복사
    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${draftKey}`,
        Key: releaseKey,
        ContentType: "application/json",
        CacheControl: "max-age=31536000, immutable", // Release 캐시 1년
        MetadataDirective: "REPLACE",
      })
    );

    // 2-4. manifest 갱신
    const newManifest = {
      latest: next,
      path: `releases/${next}.json`,
      updatedAt: new Date().toISOString(),
    };

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: manifestKey,
        Body: JSON.stringify(newManifest, null, 2),
        ContentType: "application/json",
        CacheControl: "max-age=60, must-revalidate", // Manifest는 짧게 캐시
      })
    );

    res.json({ success: true, version: next });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Publish failed" });
  }
});

// 3. 문서 목록 조회
app.get("/api/documents", async (req, res) => {
  try {
    // 간단한 구현: 하드코딩된 문서 목록 반환
    res.json([
      { id: "xromeda-main", title: "XROMEDA · 1:1 화상채팅", updatedAt: new Date().toISOString() }
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get documents" });
  }
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI Agent server running on port ${PORT}`);
  console.log(`CORS enabled for all origins`);
});
