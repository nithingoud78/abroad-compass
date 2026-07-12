const fs = require("fs");
const files = [
  "legal.about.tsx",
  "legal.contact.tsx",
  "legal.cookies.tsx",
  "legal.disclaimer.tsx",
  "legal.privacy.tsx",
  "legal.terms.tsx",
];
files.forEach((f) => {
  const name = f.split(".")[1];
  const content = `import { createFileRoute } from '@tanstack/react-router';\n\nexport const Route = createFileRoute('/_authenticated/legal/${name}')({\n  component: () => <div className="p-8 text-center">This page is under construction.</div>,\n});`;
  fs.writeFileSync("src/routes/_authenticated/" + f, content, "utf8");
});
