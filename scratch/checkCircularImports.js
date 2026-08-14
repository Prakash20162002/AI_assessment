const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../client/src');

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getAllFiles(srcDir);
const graph = new Map();

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const imports = [];

  // Match import ... from '...' and require('...')
  const importRegex = /(?:import\s+(?:[\w*\s{},]*)\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1] || match[2];
    if (importPath && (importPath.startsWith('.') || importPath.startsWith('/'))) {
      // Resolve relative path
      let resolved = path.resolve(dir, importPath);
      if (!fs.existsSync(resolved)) {
        if (fs.existsSync(resolved + '.js')) resolved += '.js';
        else if (fs.existsSync(resolved + '.jsx')) resolved += '.jsx';
        else if (fs.existsSync(path.join(resolved, 'index.js'))) resolved = path.join(resolved, 'index.js');
        else if (fs.existsSync(path.join(resolved, 'index.jsx'))) resolved = path.join(resolved, 'index.jsx');
      }
      if (fs.existsSync(resolved) && !fs.statSync(resolved).isDirectory()) {
        imports.push(resolved);
      }
    }
  }
  graph.set(file, imports);
});

console.log(`Analyzing circular dependencies across ${files.length} modules...`);

function findCycles() {
  const cycles = [];
  const visited = new Set();
  const recStack = [];

  function dfs(node) {
    visited.add(node);
    recStack.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.includes(neighbor)) {
        const cycleStartIndex = recStack.indexOf(neighbor);
        const cycle = recStack.slice(cycleStartIndex).concat(neighbor);
        cycles.push(cycle);
      }
    }

    recStack.pop();
  }

  for (const file of files) {
    visited.clear();
    recStack.length = 0;
    dfs(file);
  }

  return cycles;
}

const cycles = findCycles();
console.log(`Found ${cycles.length} circular dependency cycles.`);
cycles.forEach((cycle, i) => {
  console.log(`\nCycle ${i+1}:`);
  cycle.forEach(f => console.log(' -> ' + path.relative(srcDir, f)));
});
