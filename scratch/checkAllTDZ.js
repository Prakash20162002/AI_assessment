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
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getAllFiles(srcDir);
console.log(`Analyzing ${files.length} files in client/src...`);

let issues = [];

function checkScopeForTDZ(node, filePath, code) {
  // Collect all declarations in this function/block scope
  // If a const/let declaration occurs at statement index N, but an expression evaluated synchronously during scope execution references it at statement index < N, that's a TDZ error.
  
  function getStatements(n) {
    if (!n) return [];
    if (n.type === 'BlockStatement' || n.type === 'Program') {
      return n.body;
    }
    return [];
  }

  const statements = getStatements(node);
  if (!statements || statements.length === 0) return;

  // Track let/const declared in this block
  const blockDeclarations = [];
  statements.forEach((stmt, idx) => {
    if (stmt.type === 'VariableDeclaration' && (stmt.kind === 'const' || stmt.kind === 'let')) {
      stmt.declarations.forEach(decl => {
        if (decl.id.type === 'Identifier') {
          blockDeclarations.push({
            name: decl.id.name,
            stmtIndex: idx,
            loc: decl.id.loc || stmt.loc,
            start: decl.id.start,
            kind: stmt.kind,
            init: decl.init
          });
        } else if (decl.id.type === 'ObjectPattern' || decl.id.type === 'ArrayPattern') {
          // Extract identifiers
          function extractIds(p) {
            if (p.type === 'Identifier') {
              blockDeclarations.push({
                name: p.name,
                stmtIndex: idx,
                loc: p.loc || stmt.loc,
                start: p.start,
                kind: stmt.kind,
                init: decl.init
              });
            } else if (p.type === 'ObjectPattern') {
              p.properties.forEach(prop => {
                if (prop.type === 'Property') extractIds(prop.value);
                else if (prop.type === 'RestElement') extractIds(prop.argument);
              });
            } else if (p.type === 'ArrayPattern') {
              p.elements.forEach(elem => {
                if (elem) extractIds(elem);
              });
            } else if (p.type === 'AssignmentPattern') {
              extractIds(p.left);
            }
          }
          extractIds(decl.id);
        }
      });
    }
  });

  const declMap = new Map();
  blockDeclarations.forEach(d => {
    declMap.set(d.name, d);
  });

  // Now inspect each statement before its declaration index.
  // If an expression is executed top-level in the statement (e.g. hook call arguments, dependencies array, initializer of previous const),
  // and references an identifier declared later with const/let in the same block, that is a TDZ error!
  
  statements.forEach((stmt, stmtIdx) => {
    // Find all synchronous identifier references in stmt
    // Note: References inside a function body that is NOT immediately invoked are only executed later,
    // BUT hook dependency arrays, hook arguments, default values, initializers ARE evaluated immediately!
    
    function walkSyncExpressions(expr, inDeferredFunction = false) {
      if (!expr) return;

      // If we enter a FunctionDeclaration, FunctionExpression, ArrowFunctionExpression:
      // References inside its body are deferred UNLESS it is an IIFE or in a hook arg that is executed sync (e.g. useMemo? useMemo executes sync!).
      // But dependency arrays of useEffect, useCallback, useMemo are OUTSIDE the callback function!
      
      if (expr.type === 'ArrowFunctionExpression' || expr.type === 'FunctionExpression') {
        // If it's inside useMemo( () => ..., deps ), the callback is executed synchronously during render!
        // But let's check the function arguments and default values first
        expr.params.forEach(p => walkSyncExpressions(p, false));
        // Check if inside useMemo or immediately invoked
        if (!inDeferredFunction) {
          // If this function is passed to useMemo, its body IS executed synchronously!
          // We can check deferred flag
          walkSyncExpressions(expr.body, true);
        } else {
          walkSyncExpressions(expr.body, true);
        }
        return;
      }

      if (expr.type === 'FunctionDeclaration') {
        // Hoisted function body is deferred until called
        walkSyncExpressions(expr.body, true);
        return;
      }

      if (expr.type === 'CallExpression') {
        // Check callee and args
        walkSyncExpressions(expr.callee, inDeferredFunction);
        
        // If callee is useMemo, its first arg is executed synchronously!
        const isUseMemo = expr.callee.name === 'useMemo' || (expr.callee.type === 'MemberExpression' && expr.callee.property.name === 'useMemo');
        
        expr.arguments.forEach((arg, argIdx) => {
          if (isUseMemo && argIdx === 0 && (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression')) {
            // Evaluated synchronously!
            walkSyncExpressions(arg.body, false);
          } else {
            walkSyncExpressions(arg, inDeferredFunction);
          }
        });
        return;
      }

      if (expr.type === 'Identifier') {
        if (!inDeferredFunction) {
          const targetDecl = declMap.get(expr.name);
          if (targetDecl && targetDecl.stmtIndex > stmtIdx) {
            issues.push({
              file: filePath,
              transformedCode: code,
              variable: expr.name,
              usedLoc: expr.loc,
              usedStart: expr.start,
              declLoc: targetDecl.loc,
              declStart: targetDecl.start,
              kind: targetDecl.kind,
              type: 'TDZ_SYNC_USE_BEFORE_DECL'
            });
          }
        }
        return;
      }

      // Walk all child nodes
      for (const key of Object.keys(expr)) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'type') continue;
        const child = expr[key];
        if (Array.isArray(child)) {
          child.forEach(c => {
            if (c && typeof c.type === 'string') walkSyncExpressions(c, inDeferredFunction);
          });
        } else if (child && typeof child.type === 'string') {
          walkSyncExpressions(child, inDeferredFunction);
        }
      }
    }

    walkSyncExpressions(stmt, false);
  });

  // Also recurse into all nested blocks / functions
  function recurseChildren(n) {
    if (!n) return;
    for (const key of Object.keys(n)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'type') continue;
      const child = n[key];
      if (Array.isArray(child)) {
        child.forEach(c => {
          if (c && typeof c.type === 'string') {
            if (c.type === 'BlockStatement' || c.type === 'Program') {
              checkScopeForTDZ(c, filePath, code);
            } else {
              recurseChildren(c);
            }
          }
        });
      } else if (child && typeof child.type === 'string') {
        if (child.type === 'BlockStatement' || child.type === 'Program') {
          checkScopeForTDZ(child, filePath, code);
        } else {
          recurseChildren(child);
        }
      }
    }
  }

  recurseChildren(node);
}

async function main() {
  for (const file of files) {
    const rawCode = fs.readFileSync(file, 'utf8');
    try {
      const transformed = await transformWithOxc(rawCode, file);
      const ast = parseAst(transformed.code);
      checkScopeForTDZ(ast, file, transformed.code);
    } catch (err) {
      console.error(`Error parsing ${file}: ${err.message}`);
    }
  }

  console.log(`\n=== Found ${issues.length} potential TDZ issues ===`);
  issues.forEach((iss, i) => {
    const code = fs.readFileSync(iss.file, 'utf8');
    const lines = code.split('\n');
    const relFile = path.relative(path.join(__dirname, '..'), iss.file);
    console.log(`\n[${i+1}] ${relFile}`);
    console.log(`Variable: '${iss.variable}' (${iss.kind})`);
    console.log(`Used loc:`, iss.usedLoc, `Decl loc:`, iss.declLoc);
    if (iss.usedStart !== undefined) {
      const transformedLines = iss.transformedCode.slice(0, iss.usedStart).split('\n');
      console.log(`Used around transformed line ${transformedLines.length}:`);
      console.log(iss.transformedCode.split('\n')[transformedLines.length - 1]);
    }
    if (iss.declStart !== undefined) {
      const transformedLines = iss.transformedCode.slice(0, iss.declStart).split('\n');
      console.log(`Decl around transformed line ${transformedLines.length}:`);
      console.log(iss.transformedCode.split('\n')[transformedLines.length - 1]);
    }
  });
}

main().catch(console.error);
