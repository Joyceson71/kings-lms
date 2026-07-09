/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const fs = require('fs');
const path = require('path');

const files = [
  "src/components/layout/ai-assistant.tsx",
  "src/app/not-found.tsx",
  "src/app/attend/page.tsx",
  "src/app/error.tsx",
  "src/app/dashboard/resources/page.tsx",
  "src/app/dashboard/students/students-client.tsx",
  "src/app/dashboard/settings/page.tsx",
  "src/app/dashboard/reports/page.tsx",
  "src/app/dashboard/leaderboard/page.tsx",
  "src/app/dashboard/attendance/page.tsx",
  "src/app/dashboard/announcements/page.tsx",
  "src/app/(auth)/update-password/page.tsx",
  "src/app/(auth)/reset-password/page.tsx",
  "src/app/dashboard/admin/users/users-client.tsx",
  "src/app/(auth)/onboarding/page.tsx",
  "src/app/dashboard/admin/departments/page.tsx",
  "src/app/(auth)/signup/page.tsx",
  "src/app/dashboard/calendar/page.tsx"
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove import { TiltCard }
  content = content.replace(/import\s*{\s*TiltCard\s*}\s*from\s*['"]@\/components\/ui\/tilt-card['"];?\n?/g, '');

  // Regex to match <TiltCard ...> wrapping a <div ...>
  // We want to transfer the `key={...}` if it exists on TiltCard to the inner div.
  const tiltCardRegex = /<TiltCard([^>]*)>\s*(<div[^>]*>)/g;
  
  content = content.replace(tiltCardRegex, (match, tiltProps, divTag) => {
    let keyMatch = tiltProps.match(/key=\{[^}]+\}/);
    if (keyMatch) {
      // Insert key into the inner div
      return divTag.replace('<div', '<div ' + keyMatch[0]);
    }
    return divTag;
  });

  // Remove closing </TiltCard>
  content = content.replace(/<\/TiltCard>/g, '');

  // Replace glass-card classes with inline style or standard classes
  // We'll replace `className="... glass-card ..."` with `className="..." style={{ background: '#111113', border: '1px solid #1f1f23' }}`
  // But some might already have a style prop.
  // Instead of complex AST, let's just replace `glass-card` with `bg-[#111113] border border-[#1f1f23]`
  content = content.replace(/glass-card/g, 'bg-[#111113] border border-[#1f1f23]');
  
  // Remove `Outfit, sans-serif` font families
  content = content.replace(/style=\{\{\s*fontFamily:\s*['"]Outfit,\s*sans-serif['"]\s*\}\}/g, '');
  content = content.replace(/fontFamily:\s*['"]Outfit,\s*sans-serif['"],?/g, '');

  // Also replace some common oklch glows if we can find them (optional)
  content = content.replace(/boxShadow:\s*`0 4px 24px \$\{.*\}`/g, '');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
