// Force fluent-ffmpeg to use the Linux ffmpeimport express from "express";
import express from "express";
import ffmpeg from "fluent-ffmpeg";

// Force fluent-ffmpeg to use WSL's FFmpeg
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

console.log("Using FFMPEG at:", "/usr/bin/ffmpeg");


const app = express();
app.use(express.json());

app.post("/process-video", (req, res) => {
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    if (!inputFilePath || !outputFilePath) {
        return res.status(400).send("Bad Request: Missing file path.");
    }

    ffmpeg(inputFilePath)
        .outputOptions("-vf", "scale=-1:360")
        .on("end", () => {
            res.status(200).send("Video processing finished successfully.");
        })
        .on("error", (err) => {
            console.error("FFMPEG ERROR:", err);
            res.status(500).send(`Internal Server Error: ${err.message}`);
        })
        .save(outputFilePath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`);
});
