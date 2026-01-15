const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'frontend/src/app/features');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has OnPush
  if (content.includes('ChangeDetectionStrategy.OnPush')) {
    return false;
  }
  
  // Add ChangeDetectionStrategy to imports if not present
  if (!content.includes('ChangeDetectionStrategy')) {
    content = content.replace(
      /import \{ ([^}]+) \} from '@angular\/core';/,
      (match, imports) => {
        return `import { ${imports}, ChangeDetectionStrategy } from '@angular/core';`;
      }
    );
  }
  
  // Add changeDetection to @Component decorator
  content = content.replace(
    /@Component\(\{\s*\n(\s*)selector:/,
    '@Component({\n$1selector:'
  );
  
  content = content.replace(
    /@Component\(\{\s*selector:\s*'([^']+)',\s*\n(\s*)standalone:\s*true,\s*\n(\s*)imports:/,
    "@Component({\n  selector: '$1',\n  standalone: true,\n  changeDetection: ChangeDetectionStrategy.OnPush,\n$3imports:"
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.component.ts')) {
      callback(dirPath);
    }
  });
}

let modified = 0;
walkDir(featuresDir, (filePath) => {
  if (processFile(filePath)) {
    console.log('Modified:', filePath);
    modified++;
  }
});

console.log(`\nTotal files modified: ${modified}`);
