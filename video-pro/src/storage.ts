// 1. GCS file interactions
//2. Local file interactions
import{ Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg'

const storage = new Storage();

const rawVideoBucketName = "neetcode-yt-raw-vidoes";
const processedVideoBucketName = "neetcode-yt-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";


/**
 * Creates the local directories for the raw and processed videos.
 */
export function setUpDirectories(){
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - the name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName:string): Promise<void>{
    return new Promise((resolve,reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions("-vf", "scale=-1:360")
            .on("end", () => {
                console.log("Video processing finished successfully.");
                resolve();
                
            })
            .on("error", (err) => {
                console.log(`Internal Server Error: ${err.message}`);
                reject(err);
            })
            .save(`${localProcessedVideoPath}/${processedVideoName}`);

    })
}

/**
 * @param fileName - The name of the file to download from.
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downlaoded.
 */
export async function downloadRawVideo(fileName: string){
    await storage.bucket(rawVideoBucketName)
    .file(fileName)
    .download({destination: `${localRawVideoPath}/${fileName}`});

    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
    )
}

/**
 * @param fileName - The name of  the  file to upload from the 
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolves when the file has been uploaded.
 */
export async function uploadProcessedVideo(fileName:string){
    const bucket = storage.bucket(processedVideoBucketName);

    await bucket.upload(`${localProcessedVideoPath}/${fileName}`,{
        destination: fileName
    })
    console.log(`${localProcessedVideoPath}/${fileName} uploadeed to gs://${processedVideoBucketName}/${fileName}.`

    );
    await bucket.file(fileName).makePublic();
}

/**
 * 
 */
function deleteFile(filePath: string): Promise<void>{
    return new Promise((resolve,reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if(err){
                    console.log(`Failed to delete file at this given path`);
                    reject(err);
                } else {
                    console.log(`File deleted at ${filePath}`)
                    resolve();
                }
            })
        } else {
            console.log(`File not found at ${filePath}, skipping the delete`);
            resolve()
        }
    });
}

/**
 * 
 * @param fileName The name of the file to delete from the {@link localRawVideoPath}
 * @returns A promise that resolves when the file has been deleted.
 */
export function deleteRawVideo(fileName:string){
    return deleteFile( `${localRawVideoPath}/${fileName}`);
}

/**
 * 
 * @param fileName The name of the file to delete from the {@link localProcessedVideoPath}
 * @returns A promise  that resolves when the file has been deleted.
 */
export function deleteProcessedVideo(fileName:string){
    return deleteFile( `${localProcessedVideoPath}/${fileName}`);
}

function ensureDirectoryExistence(dirPath:string){
    if(!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, {recursive: true});
        console.log(`Directory created at ${dirPath}`);
    }
}
