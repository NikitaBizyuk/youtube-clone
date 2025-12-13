// 1. GCS file interactions
// 2. Local file interactions
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const storage = new Storage();

// Your Cloud Storage buckets
const rawVideoBucketName = "neetcode_yt_raw_videos";
const processedVideoBucketName = "neetcode_yt_processed_videos";

// Cloud Run can ONLY write to /tmp
const localRawVideoPath = "/tmp/raw-videos";
const localProcessedVideoPath = "/tmp/processed-videos";

/**
 * Creates the local directories for raw + processed videos.
 * Cloud Run only allows writing inside /tmp, so we must use that location.
 */
export function setUpDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 * Convert video using FFmpeg
 */
export function convertVideo(rawVideoName: string, processedVideoName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const inputPath = `${localRawVideoPath}/${rawVideoName}`;
        const outputPath = `${localProcessedVideoPath}/${processedVideoName}`;

        ffmpeg(inputPath)
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
export async function downloadRawVideo(fileName: string) {
    const destination = `${localRawVideoPath}/${fileName}`;

    await storage
        .bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination });

    console.log(
        `Downloaded gs://${rawVideoBucketName}/${fileName} → ${destination}`
    );
}

/**
 * Upload processed video from /tmp/processed-videos → Cloud Storage
 */
export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);
    const filePath = `${localProcessedVideoPath}/${fileName}`;

    await bucket.upload(filePath, { destination: fileName });

    console.log(`Uploaded ${filePath} → gs://${processedVideoBucketName}/${fileName}`);
}

/**
 * Delete a local file inside /tmp
 */
function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Failed to delete file ${filePath}:`, err);
                } else {
                    console.log(`Deleted file: ${filePath}`);
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
}

// Delete raw video from /tmp
export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

// Delete processed video from /tmp
export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * Create directory if missing
 */
function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory created: ${dirPath}`);
    }
}
