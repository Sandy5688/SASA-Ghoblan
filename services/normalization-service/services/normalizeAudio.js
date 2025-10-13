import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import path from "path";

/**
 * Normalize audio file to MP3, embed artwork, and apply loudness targets
 * @param {string} inputPath - path to source file
 * @param {string} outputPath - path to output normalized file
 * @param {string} artworkPath - optional path to cover art
 */
export const normalizeAudioFile = (inputPath, outputPath, artworkPath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) return reject(new Error("Input file does not exist"));

    let command = ffmpeg(inputPath)
      .audioCodec("libmp3lame")
      .audioBitrate("192k")
      .format("mp3")
      .outputOptions("-af", "loudnorm") // basic loudness normalization

    if (artworkPath && fs.existsSync(artworkPath)) {
      command = command.input(artworkPath).outputOptions("-map", "0:a", "-map", "1:v", "-id3v2_version", "3");
    }

    command
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(outputPath);
  });
};
