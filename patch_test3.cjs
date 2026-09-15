const fs = require('fs');
let code = fs.readFileSync('src/components/StatusViewer.test.tsx', 'utf8');

const regexNaN = /renderViewer\(videoGroup, 0\);\s*\n\s*\/\/[^\n]*\n\s*act\(\(\) => \{/m;
code = code.replace(regexNaN, `renderViewer(videoGroup, 0);
    const video = screen.getByRole("presentation", { hidden: true }) || document.querySelector("video");
    if (video) fireEvent.loadedMetadata(video);
    act(() => {`);
    
const regexZero = /renderViewer\(videoGroup, 0\);\s*\n\s*act\(\(\) => \{/m;
code = code.replace(regexZero, `renderViewer(videoGroup, 0);
    const video = document.querySelector("video");
    if (video) fireEvent.loadedMetadata(video);
    act(() => {`);

fs.writeFileSync('src/components/StatusViewer.test.tsx', code);
