import fs from 'fs';
import path from 'path';

function findDirectories(dirPath, minDepth = 0) {
  const directories = [];

  function traverse(currentPath, depth) {
    const files = fs.readdirSync(currentPath);

    files.forEach((file) => {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && depth >= minDepth) {
        directories.push(filePath);
      }
      if (stat.isDirectory()) {
        traverse(filePath, depth + 1);
      }
    });
  }

  traverse(dirPath, 1);
  return directories;
}

function findFiles(dir, extensions) {
  const files = [];

  function search(directory) {
    const items = fs.readdirSync(directory);

    items.forEach((item) => {
      const itemPath = path.join(directory, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile() && extensions.includes(path.extname(item))) {
        files.push(itemPath);
      } else if (stat.isDirectory()) {
        search(itemPath);
      }
    });
  }

  search(dir);
  return files;
}

export {
  findDirectories,
  findFiles,
};
