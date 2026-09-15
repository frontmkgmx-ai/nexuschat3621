const fs = require('fs');
let code = fs.readFileSync('src/components/Inpage.tsx', 'utf8');

const regex = /\{currentStatus && currentGroup && \([\s\S]*?\)\s*\}\s*<\/AnimatePresence>/m;
const replacement = `{currentStatus && currentGroup && (
          <StatusViewer 
             currentGroup={currentGroup}
             viewingStatusIdx={viewingStatusIdx}
             currentUser={currentUser}
             onNext={handleNextStatus}
             onPrev={handlePrevStatus}
             onClose={closeViewer}
             onRemove={handleRemoveStatus}
          />
        )}
      </AnimatePresence>`;

const newCode = code.replace(regex, replacement);
fs.writeFileSync('src/components/Inpage.tsx', newCode);
