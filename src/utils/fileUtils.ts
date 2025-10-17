"use client";

import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Interface for file objects to be downloaded
 */
export interface DownloadableFile {
  url: string;
  fileName: string;
}

/**
 * Downloads a single file from a URL
 * @param url - The URL of the file to download
 * @param fileName - The name to save the file as
 */
export const downloadSingleFile = async (
  url: string,
  fileName: string
): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();
    saveAs(blob, fileName);
    return Promise.resolve();
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

/**
 * Downloads multiple files as a zip archive
 * @param files - Array of file objects with url and fileName
 * @param zipFileName - Name for the zip file (without extension)
 */
export const downloadFilesAsZip = async (
  files: DownloadableFile[],
  zipFileName: string = "download"
): Promise<void> => {
  if (files.length === 0) {
    console.warn("No files to download");
    return Promise.resolve();
  }

  if (files.length === 1) {
    // If there's only one file, download it directly
    return downloadSingleFile(files[0].url, files[0].fileName);
  }

  try {
    const zip = new JSZip();

    // Add each file to the zip
    const filePromises = files.map(async (file) => {
      try {
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch file ${file.fileName}: ${response.status} ${response.statusText}`
          );
        }

        const blob = await response.blob();
        zip.file(file.fileName, blob);
        return true;
      } catch (error) {
        console.error(`Error adding ${file.fileName} to zip:`, error);
        return false;
      }
    });

    // Wait for all files to be processed
    await Promise.all(filePromises);

    // Generate the zip file and trigger download
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${zipFileName}.zip`);

    return Promise.resolve();
  } catch (error) {
    console.error("Error creating zip file:", error);
    throw error;
  }
};

/**
 * Main download function that determines whether to download a single file or create a zip
 * @param files - Single file or array of files to download
 * @param zipFileName - Optional name for the zip file if multiple files are downloaded
 */
export const downloadFiles = (
  files: DownloadableFile | DownloadableFile[],
  zipFileName?: string
): Promise<void> => {
  // Handle single file
  if (!Array.isArray(files)) {
    return downloadSingleFile(files.url, files.fileName);
  }

  // Handle array of files
  return downloadFilesAsZip(files, zipFileName);
};
