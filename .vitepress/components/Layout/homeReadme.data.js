import fs from "node:fs";

export default {
  watch: ["../../../README.md"],
  load(watchedFiles) {
    let homeReadmeData = {};
    watchedFiles.forEach((file) => {
      // console.log('file:', file) // => file: README.md
      
      const fileContent = fs.readFileSync(file, "utf-8");
      const doneNotesID = getDoneNotesID(fileContent);
      const doneNotesLen = doneNotesID.length;

      homeReadmeData = {
        fileContent,
        doneNotesID,
        doneNotesLen,
      };
    });
    return homeReadmeData
  },
};

/**
 * 返回已完成的笔记的 ID 列表
 * @param {string} fileContent 文件内容
 * @returns 已完成的笔记的 ID 列表
 */
function getDoneNotesID(fileContent) {
  const matches = fileContent.match(/- \[x\]\s\[(\d{4})\./g);
  return matches ? [...new Set(matches.map(match => match.slice(-5, -1)))] : [];
}