const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        fs.statSync(dirPath).isDirectory() ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const apiDir = path.join(__dirname, 'app', 'api');

walkDir(apiDir, function(filePath) {
    if (filePath.endsWith('route.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('export const dynamic')) {
            const lines = content.split('\n');
            let lastImportIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('import ')) {
                    lastImportIndex = i;
                }
            }
            if (lastImportIndex !== -1) {
                lines.splice(lastImportIndex + 1, 0, '\nexport const dynamic = \'force-dynamic\';');
                fs.writeFileSync(filePath, lines.join('\n'));
                console.log('Fixed:', filePath);
            }
        }
    }
});
