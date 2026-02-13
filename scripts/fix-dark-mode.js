#!/usr/bin/env node

/**
 * Dark Mode Color Fix Script
 * 
 * This script fixes hardcoded Tailwind colors to use theme-aware CSS variables
 * Run this to fix all pages for dark mode compatibility
 */

const fs = require('fs');
const path = require('path');

// Color mapping from hardcoded to theme-aware
const colorReplacements = [
    // Text colors
    { from: /text-slate-900/g, to: 'text-foreground' },
    { from: /text-slate-800/g, to: 'text-foreground' },
    { from: /text-slate-700/g, to: 'text-foreground' },
    { from: /text-slate-600/g, to: 'text-muted-foreground' },
    { from: /text-slate-500/g, to: 'text-muted-foreground' },
    { from: /text-slate-400/g, to: 'text-muted-foreground' },

    // Background colors
    { from: /bg-white(?!\/)/g, to: 'bg-background' },
    { from: /bg-slate-50/g, to: 'bg-background' },
    { from: /bg-slate-100/g, to: 'bg-muted' },

    // Border colors
    { from: /border-slate-200/g, to: 'border-border' },
    { from: /border-slate-300/g, to: 'border-border' },

    // Specific color replacements for accents
    { from: /border-l-blue-600/g, to: 'border-l-primary' },
    { from: /border-l-indigo-600/g, to: 'border-l-secondary' },
    { from: /border-l-purple-600/g, to: 'border-l-primary' },
];

function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        colorReplacements.forEach(({ from, to }) => {
            if (from.test(content)) {
                content = content.replace(from, to);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

function walkDirectory(dir, fileCallback) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and .next
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walkDirectory(filePath, fileCallback);
            }
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
            fileCallback(filePath);
        }
    });
}

// Main execution
const protectedDir = path.join(__dirname, '..', 'app', 'protected');
let fixedCount = 0;

console.log('🔍 Scanning for files with hardcoded colors...\n');

walkDirectory(protectedDir, (filePath) => {
    if (fixFile(filePath)) {
        fixedCount++;
    }
});

console.log(`\n✨ Done! Fixed ${fixedCount} files.`);
console.log('🌙 All pages should now support dark mode properly!');
