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
exports.setUpDirectories = setUpDirectories;
exports.convertVideo = convertVideo;
exports.downloadRawVideo = downloadRawVideo;
exports.uploadProcessedVideo = uploadProcessedVideo;
exports.deleteRawVideo = deleteRawVideo;
exports.deleteProcessedVideo = deleteProcessedVideo;
// 1. GCS file interactions
// 2. Local file interactions
const storage_1 = require("@google-cloud/storage");
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const storage = new storage_1.Storage();
// Your Cloud Storage buckets
const rawVideoBucketName = "neetcode-yt-raw-vidoes";
const processedVideoBucketName = "neetcode-yt-processed-videos";
// Cloud Run can ONLY write to /tmp
const localRawVideoPath = "/tmp/raw-videos";
const localProcessedVideoPath = "/tmp/processed-videos";
/**
 * Creates the local directories for raw + processed videos.
 * Cloud Run only allows writing inside /tmp, so we must use that location.
 */
function setUpDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}
/**
 * Convert video using FFmpeg
 */
function convertVideo(rawVideoName, processedVideoName) {
    return new Promise((resolve, reject) => {
        const inputPath = `${localRawVideoPath}/${rawVideoName}`;
        const outputPath = `${localProcessedVideoPath}/${processedVideoName}`;
        (0, fluent_ffmpeg_1.default)(inputPath)
            .outputOptions("-vf", "scale=-1:360")
            .on("end", () => {
            console.log("Video processing finished successfully.");
            resolve();
        })
            .on("error", (err) => {
            console.error(`FFmpeg Error: ${err.message}`);
            reject(err);
        })
            .save(outputPath);
    });
}
/**
 * Download raw video from Cloud Storage → /tmp/raw-videos
 */
function downloadRawVideo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const destination = `${localRawVideoPath}/${fileName}`;
        yield storage
            .bucket(rawVideoBucketName)
            .file(fileName)
            .download({ destination });
        console.log(`Downloaded gs://${rawVideoBucketName}/${fileName} → ${destination}`);
    });
}
/**
 * Upload processed video from /tmp/processed-videos → Cloud Storage
 */
function uploadProcessedVideo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const bucket = storage.bucket(processedVideoBucketName);
        const filePath = `${localProcessedVideoPath}/${fileName}`;
        yield bucket.upload(filePath, { destination: fileName });
        console.log(`Uploaded ${filePath} → gs://${processedVideoBucketName}/${fileName}`);
    });
}
/**
 * Delete a local file inside /tmp
 */
function deleteFile(filePath) {
    return new Promise((resolve) => {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Failed to delete file ${filePath}:`, err);
                }
                else {
                    console.log(`Deleted file: ${filePath}`);
                }
                resolve();
            });
        }
        else {
            resolve();
        }
    });
}
// Delete raw video from /tmp
function deleteRawVideo(fileName) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}
// Delete processed video from /tmp
function deleteProcessedVideo(fileName) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}
/**
 * Create directory if missing
 */
function ensureDirectoryExistence(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory created: ${dirPath}`);
    }
}
