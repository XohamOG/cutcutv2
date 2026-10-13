import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import {
  buildGamingHighlightGraph,
  MOCK_STREAMS,
  CREATOR_PROFILES,
  getStorageDir,
  getProjectRoot,
  getPublicExportsDir,
} from "../../aai/dist/index.js";
import type {
  StreamMetadata,
  CreatorProfile,
  CandidateClip,
} from "../../aai/dist/types/pipeline.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

function sendJson(
  res: http.ServerResponse,
  statusCode: number,
  data: Record<string, unknown>
) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-filename",
  });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function streamVideoWithRange(req: http.IncomingMessage, res: http.ServerResponse, filePath: string) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
      "Access-Control-Allow-Origin": "*",
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-filename",
    });
    res.end();
    return;
  }

  // Health Check
  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "cutcut-backend",
      engine: "LangGraph 10-Agent Pipeline with Real FFmpeg Execution",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Video Upload Endpoint (accepts binary stream / file payload)
  if (req.method === "POST" && url.pathname === "/api/upload") {
    try {
      const storageDir = getStorageDir();
      const rawName = req.headers["x-filename"]
        ? decodeURIComponent(req.headers["x-filename"] as string)
        : url.searchParams.get("name") || "uploaded_vod.mp4";
      const safeName = `${Date.now()}_${path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const uploadPath = path.resolve(storageDir, "uploads", safeName);

      const writeStream = fs.createWriteStream(uploadPath);
      let totalBytes = 0;

      req.on("data", (chunk) => {
        totalBytes += chunk.length;
      });

      req.pipe(writeStream);

      writeStream.on("finish", () => {
        sendJson(res, 200, {
          success: true,
          filePath: uploadPath,
          fileName: safeName,
          sizeBytes: totalBytes,
          message: "Video uploaded successfully to processing staging.",
        });
      });

      writeStream.on("error", (err) => {
        sendJson(res, 500, { success: false, error: err.message });
      });
      return;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return;
    }
  }

  // Static Video Export Server with HTTP Range Streaming
  if (req.method === "GET" && url.pathname.startsWith("/exports/")) {
    const fileName = path.basename(url.pathname);
    const storageDir = getStorageDir();
    const publicExports = getPublicExportsDir();
    const candidatePaths = [
      path.resolve(storageDir, "exports", fileName),
      path.resolve(publicExports, fileName),
      path.resolve(storageDir, "clips", fileName),
      path.resolve(storageDir, "work", fileName),
      path.resolve(process.cwd(), "..", "storage", "exports", fileName),
      path.resolve(process.cwd(), "storage", "exports", fileName),
      path.resolve(process.cwd(), "..", fileName),
    ];

    const found = candidatePaths.find((p) => fs.existsSync(p));
    if (found) {
      streamVideoWithRange(req, res, found);
      return;
    }
  }

  // Streams endpoint
  if (req.method === "GET" && url.pathname === "/api/streams") {
    sendJson(res, 200, { success: true, streams: MOCK_STREAMS });
    return;
  }

  // Creators endpoint
  if (req.method === "GET" && url.pathname === "/api/creators") {
    sendJson(res, 200, { success: true, creators: CREATOR_PROFILES });
    return;
  }

  // Pipeline execution endpoint (Real LangGraph multi-agent execution)
  if (req.method === "POST" && url.pathname === "/api/pipeline") {
    let body: Record<string, unknown>;
    try {
      body = await parseBody(req);
    } catch {
      sendJson(res, 400, {
        success: false,
        error: "Request body must be valid JSON.",
      });
      return;
    }

    try {
      const { action, streamId, creatorId, streamTitle, filePath, approvedClipId, updatedHook } = body as {
        action?: string;
        streamId?: string;
        creatorId?: string;
        streamTitle?: string;
        filePath?: string;
        approvedClipId?: string;
        updatedHook?: string;
      };

      const baseStream: StreamMetadata =
        MOCK_STREAMS.find((s) => s.id === streamId) || MOCK_STREAMS[0];

      // Provide real local video file path if exists, or generate test_sample.mp4
      const defaultSample = path.resolve(process.cwd(), "..", "test_sample.mp4");
      const resolvedFilePath = filePath && fs.existsSync(filePath)
        ? filePath
        : fs.existsSync(defaultSample)
        ? defaultSample
        : undefined;

      const stream: StreamMetadata = {
        ...baseStream,
        title: streamTitle || baseStream.title,
        filePath: resolvedFilePath,
      };

      const creator: CreatorProfile =
        CREATOR_PROFILES.find((c) => c.id === creatorId) || CREATOR_PROFILES[0];

      const graph = buildGamingHighlightGraph();

      if (action === "run_to_review") {
        const initialState = {
          stream,
          creator,
          chunks: [],
          events: [],
          signals: [],
          candidates: [],
          currentStage: "ingestion" as const,
          logs: [],
          requireHumanReview: true,
          humanApproved: false,
          isCompleted: false,
        };

        const result = await graph.invoke(initialState);
        sendJson(res, 200, { success: true, state: result });
        return;
      }

      if (action === "approve_and_publish") {
        const initialState = {
          stream,
          creator,
          chunks: [],
          events: [],
          signals: [],
          candidates: [],
          currentStage: "ingestion" as const,
          logs: [],
          requireHumanReview: false,
          humanApproved: true,
          isCompleted: false,
        };

        const result = await graph.invoke(initialState);

        if (updatedHook && result.candidates && result.candidates.length > 0) {
          result.candidates = result.candidates.map((c: CandidateClip) => {
            if (c.id === approvedClipId || !approvedClipId) {
              const hooks = [...c.hooks];
              hooks[0] = { ...hooks[0], hookText: updatedHook };
              return { ...c, hooks };
            }
            return c;
          });
        }

        sendJson(res, 200, { success: true, state: result });
        return;
      }

      // Default: run full end-to-end real pipeline
      const result = await graph.invoke({
        stream,
        creator,
        chunks: [],
        events: [],
        signals: [],
        candidates: [],
        currentStage: "ingestion" as const,
        logs: [],
        requireHumanReview: false,
        humanApproved: true,
        isCompleted: true,
      });

      sendJson(res, 200, { success: true, state: result });
    } catch (err: unknown) {
      console.error("Backend pipeline error:", err);
      const msg = err instanceof Error ? err.message : "Internal Error";
      sendJson(res, 500, { success: false, error: msg });
    }
    return;
  }

  // Not Found
  sendJson(res, 404, { error: "Route not found", path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`[CutCut Backend] Node.js server listening on http://localhost:${PORT}`);
});
