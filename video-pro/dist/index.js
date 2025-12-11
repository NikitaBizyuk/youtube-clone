"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const storage_1 = require("./storage");
// Setup local /tmp directories
(0, storage_1.setUpDirectories)();
// Tell fluent-ffmpeg where ffmpeg is inside the container
fluent_ffmpeg_1.default.setFfmpegPath("/usr/bin/ffmpeg");
console.log("Using FFMPEG at /usr/bin/ffmpeg");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post("/process-video", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let data;
    try {
        const message = Buffer.from(req.body.message.data, "base64").toString("utf8");
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error("Missing filename");
        }
    }
    catch (error) {
        console.error(error);
        return res.status(400).send("Bad Request: missing filename.");
    }
    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;
    try {
        yield (0, storage_1.downloadRawVideo)(inputFileName);
        yield (0, storage_1.convertVideo)(inputFileName, outputFileName);
        yield (0, storage_1.uploadProcessedVideo)(outputFileName);
    }
    catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error: video processing failed");
    }
    // Cleanup temporary files
    yield (0, storage_1.deleteRawVideo)(inputFileName);
    yield (0, storage_1.deleteProcessedVideo)(outputFileName);
    return res.status(200).send("Processing finished successfully");
}));
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Video processing service listening on port ${port}`);
});
