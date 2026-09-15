const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('isConnecting')) {
    code = code.replace(
        /import React, \{ useState, useEffect \} from 'react';/,
        "import React, { useState, useEffect, useRef } from 'react';"
    );
    code = code.replace(
        /const \[url, setUrl\] = useState<string \| null>\(null\);/g,
        'const [url, setUrl] = useState<string | null>(null);\n  const isConnecting = useRef(false);'
    );
    code = code.replace(
        /const connectToAI = async \(\) => \{/g,
        'const connectToAI = async () => {\n    if (isConnecting.current) return;\n    isConnecting.current = true;\n'
    );
    code = code.replace(
        /setErrorState\(true\);\n\s*\}/g,
        'setErrorState(true);\n    } finally {\n      isConnecting.current = false;\n    }'
    );
}

fs.writeFileSync(file, code);
console.log("NexusAI patched double fetch");
