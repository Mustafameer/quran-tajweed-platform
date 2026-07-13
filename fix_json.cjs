const fs = require('fs');

// Read the file
const content = fs.readFileSync('data-store.json', 'utf8');

// Find the position where auditLogs ends and the corruption begins
const auditLogsEnd = content.indexOf('"auditLogs": [],');
if (auditLogsEnd === -1) {
  console.log('Could not find auditLogs');
  process.exit(1);
}

// Find where the books section starts
const booksStart = content.indexOf('"books": [');
if (booksStart === -1) {
  console.log('Could not find books section');
  process.exit(1);
}

// Reconstruct the file
const beforeAuditLogs = content.substring(0, auditLogsEnd + '"auditLogs": [],'.length);
const fromBooks = content.substring(booksStart);

// Combine them
const fixedContent = beforeAuditLogs + '\n  ' + fromBooks;

// Write back
fs.writeFileSync('data-store.json', fixedContent);

console.log('JSON file fixed successfully');
