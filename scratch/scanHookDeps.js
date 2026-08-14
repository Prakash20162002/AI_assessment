const fs = require('fs');
const path = require('path');
const { parseAst, transformWithOxc } = require(path.join(__dirname, '../client/node_modules/vite/dist/node/index.js'));

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

async function scanHooks() {
  const issues = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const transformed = await transformWithOxc(raw, file);
    const ast = parseAst(transformed.code);

    function checkFunction(fnNode) {
      if (!fnNode || !fnNode.body || fnNode.body.type !== 'BlockStatement') return;
      const body = fnNode.body.body;

      // Track all declarations and their statement indices
      const declIndex = new Map();
      body.forEach((stmt, idx) => {
        if (stmt.type === 'VariableDeclaration' && (stmt.kind === 'const' || stmt.kind === 'let')) {
          stmt.declarations.forEach(d => {
            if (d.id.type === 'Identifier') {
              declIndex.set(d.id.name, { index: idx, kind: stmt.kind });
            }
          });
        }
      });

      // Walk statements and check Hook calls
      body.forEach((stmt, stmtIdx) => {
        function checkNode(node) {
          if (!node) return;
          if (node.type === 'CallExpression') {
            const calleeName = node.callee.name || (node.callee.property ? node.callee.property.name : null);
            if (calleeName && /^use[A-Z]/.test(calleeName)) {
              // This is a hook call! Check its arguments and especially dependency array
              node.arguments.forEach((arg, argIdx) => {
                // If it's a callback function, check its parameters, but the body is deferred (except useMemo callback)
                if (arg.type === 'ArrayExpression') {
                  // Dependency array! Every element is evaluated synchronously at render time!
                  arg.elements.forEach(elem => {
                    if (elem && elem.type === 'Identifier') {
                      const decl = declIndex.get(elem.name);
                      if (decl && decl.index > stmtIdx) {
                        issues.push({
                          file,
                          hook: calleeName,
                          variable: elem.name,
                          stmtIndex: stmtIdx,
                          declIndex: decl.index,
                          transformedLine: transformed.code.slice(0, elem.start).split('\n').length
                        });
                      }
                    }
                  });
                } else if (arg.type === 'Identifier') {
                  // Direct identifier passed to hook!
                  const decl = declIndex.get(arg.name);
                  if (decl && decl.index > stmtIdx) {
                    issues.push({
                      file,
                      hook: calleeName,
                      variable: arg.name,
                      stmtIndex: stmtIdx,
                      declIndex: decl.index,
                      transformedLine: transformed.code.slice(0, arg.start).split('\n').length
                    });
                  }
                }
              });
            }
          }

          // Recursively check expressions, but don't enter nested function declarations/expressions for hook calls since hooks are top-level
          for (const key of Object.keys(node)) {
            if (key === 'loc' || key === 'start' || key === 'end' || key === 'type') continue;
            const child = node[key];
            if (Array.isArray(child)) {
              child.forEach(c => {
                if (c && typeof c.type === 'string' && c.type !== 'FunctionDeclaration' && c.type !== 'FunctionExpression' && c.type !== 'ArrowFunctionExpression') {
                  checkNode(c);
                }
              });
            } else if (child && typeof child.type === 'string' && child.type !== 'FunctionDeclaration' && child.type !== 'FunctionExpression' && child.type !== 'ArrowFunctionExpression') {
              checkNode(child);
            }
          }
        }

        checkNode(stmt);
      });
    }

    function walkAst(n) {
      if (!n) return;
      if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
        checkFunction(n);
      }
      for (const key of Object.keys(n)) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'type') continue;
        const child = n[key];
        if (Array.isArray(child)) {
          child.forEach(c => { if (c && typeof c.type === 'string') walkAst(c); });
        } else if (child && typeof child.type === 'string') {
          walkAst(child);
        }
      }
    }

    walkAst(ast);
  }

  console.log(`Scan complete. Found ${issues.length} hook dependency TDZ issues.`);
  issues.forEach((iss, i) => {
    console.log(`[${i+1}] ${path.relative(srcDir, iss.file)} - Hook ${iss.hook} references '${iss.variable}' (stmt ${iss.stmtIndex}) before its declaration (stmt ${iss.declIndex}) around line ${iss.transformedLine}`);
  });
}

scanHooks().catch(console.error);
