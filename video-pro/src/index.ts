import express from "express";
import ffmpeg from "fluent-ffmpeg";
import {
    downloadRawVideo,
    setUpDirectories,
    uploadProcessedVideo,
    convertVideo,
    deleteRawVideo,
    deleteProcessedVideo
} from "./storage";

// Setup local /tmp directories
setUpDirectories();

// Tell fluent-ffmpeg where ffmpeg is inside the container
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

console.log("Using FFMPEG at /usr/bin/ffmpeg");

const app = express();
app.use(express.json());

app.post("/process-video", async (req, res) => {
    let data;
    try {
        const message = Buffer.from(req.body.message.data, "base64").toString("utf8");
        data = JSON.parse(message);

        if (!data.name) {
            throw new Error("Missing filename");
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send("Bad Request: missing filename.");
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    try {
        await downloadRawVideo(inputFileName);
        await convertVideo(inputFileName, outputFileName);
        await uploadProcessedVideo(outputFileName);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error: video processing failed");
    }

    // Cleanup temporary files
    await deleteRawVideo(inputFileName);
    await deleteProcessedVideo(outputFileName);

    return res.status(200).send("Processing finished successfully");
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Video processing service listening on port ${port}`);
});
