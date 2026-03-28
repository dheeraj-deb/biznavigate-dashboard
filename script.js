const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Add AppLogo import
  if (!content.includes('AppLogo')) {
    content = content.replace("import { Input } from '@/components/ui/input'", "import { Input } from '@/components/ui/input'\nimport { AppLogo } from '@/components/ui/app-logo'");
  }

  // Replace Logo HTML
  content = content.replace(/<div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700[\s\S]*?<\/div>\s*<span className="text-2xl font-bold/g, `<div className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 group-hover:shadow-[0_8px_30px_rgba(37,99,235,0.2)] group-hover:-translate-y-0.5">
                <AppLogo className="h-10 w-10 shadow-lg rounded-[12px]" />
              </div>
              <span className="text-2xl font-bold`);

  // Replace colors
  content = content.replace(/violet-600/g, 'blue-600');
  content = content.replace(/violet-500/g, 'blue-600'); // make form outlines darker blue
  content = content.replace(/violet-200/g, 'blue-200');
  content = content.replace(/violet-100/g, 'blue-100');
  content = content.replace(/violet-300/g, 'blue-300');
  content = content.replace(/indigo-700/g, 'blue-800');
  content = content.replace(/indigo-600/g, 'blue-700');
  content = content.replace(/indigo-200/g, 'slate-200');
  content = content.replace(/fuchsia-100/g, 'blue-50');
  content = content.replace(/139, 92, 246/g, '37, 99, 235');
  content = content.replace(/139,92,246/g, '37,99,235');
  
  // Compact layout (reducing max width/paddings sizes)
  content = content.replace(/className="h-12 /g, 'className="h-10 ');
  content = content.replace(/h-12 w-full/g, 'h-10 w-full'); // mainly inputs and button
  content = content.replace(/top-1\/2 -translate-y-1\/2/g, 'top-1/2 -translate-y-1/2'); // just verifying
  content = content.replace(/mb-8 flex/g, 'mb-6 flex');
  content = content.replace(/mb-10 text-center/g, 'mb-6 text-center');
  content = content.replace(/mb-12 flex/g, 'mb-6 flex');
  content = content.replace(/px-6 py-12/g, 'px-6 py-4');
  content = content.replace(/p-8 sm:p-12/g, 'p-8 sm:p-10');
  content = content.replace(/space-y-4/g, 'space-y-3');
  content = content.replace(/space-y-5/g, 'space-y-4');
  content = content.replace(/mt-6/g, 'mt-4');
  content = content.replace(/mt-8/g, 'mt-6');

  // Change background to black/blue themed layout
  // Wait, the user said white black blue theme.
  // The left panel background is bg-white/80 and bg-slate-50. This perfectly fits "white".
  // Black text `text-slate-900` matches black.

  fs.writeFileSync(file, content);
}

processFile('src/app/auth/login/page.tsx');
processFile('src/app/auth/register/page.tsx');
