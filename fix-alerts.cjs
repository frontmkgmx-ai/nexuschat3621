const fs = require('fs');

function processFile(file) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes("import { toast } from 'sonner';") && content.includes("alert(")) {
      content = "import { toast } from 'sonner';\n" + content;
    }
    content = content.replace(/alert\(/g, "toast.error(");
    // Fix the success ones
    content = content.replace(/toast\.error\("Perfil atualizado!"\)/g, 'toast.success("Perfil atualizado!")');
    content = content.replace(/toast\.error\("Conta Google vinculada com sucesso!"\)/g, 'toast.success("Conta Google vinculada com sucesso!")');
    content = content.replace(/toast\.error\("Conta Google desvinculada com sucesso!"\)/g, 'toast.success("Conta Google desvinculada com sucesso!")');
    content = content.replace(/toast\.error\(`\$\{addedCount\} contatos Google sincronizados com sucesso\.`\)/g, 'toast.success(`${addedCount} contatos Google sincronizados com sucesso.`)');
    content = content.replace(/toast\.error\("Denúncia enviada com sucesso para moderação\."\)/g, 'toast.success("Denúncia enviada com sucesso para moderação.")');
    
    fs.writeFileSync(file, content);
  } catch (e) {
    console.error(e);
  }
}

processFile('src/components/Sidebar.tsx');
processFile('src/components/ChatSettingsPanel.tsx');
processFile('src/components/CreateStatusModal.tsx');
processFile('src/components/CallRoom.tsx');
processFile('src/components/Inpage.tsx');
processFile('src/components/Login.tsx');
