import fs = require("fs");
import path = require("path");

export function getAllFiles(directory: string, foldersOnly = false): string[] {
  let filenames: string[] = [];
  const absoluteDirectory = path.resolve(directory);
  const files = fs.readdirSync(absoluteDirectory, { withFileTypes: true });

  files.forEach(file => {
    const filePath = path.join(absoluteDirectory, file.name);
    if (foldersOnly) {
      if (file.isDirectory()) {
        filenames.push(filePath);
      }
    } else {
      if (file.isFile()) {
        filenames.push(filePath);
      }
    }
  });

  return filenames;
}