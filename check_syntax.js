const fs = require('fs');
const path = require('path');
const scriptPath = path.join('c:', 'Users', 'M lapan', 'OneDrive', 'Desktop', 'AL-KHAIR66 - Copy', 'script.js');

try {
    const code = fs.readFileSync(scriptPath, 'utf8');
    new Function(code);
    console.log("Syntax OK");
} catch (e) {
    console.error("Syntax Error found:");
    console.error(e.message);
    // Find the line number if possible
    if (e.stack) {
        console.error(e.stack);
    }
}
