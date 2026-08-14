const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '../client/dist/assets/index-BPfdOpmo.js.map');
const rawMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

// VLQ decoding
const charToInteger = {};
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
for (let i = 0; i < chars.length; i++) {
  charToInteger[chars.charAt(i)] = i;
}

function decodeMappings(mappings) {
  let generatedLine = 1;
  let generatedColumn = 0;
  let sourceIndex = 0;
  let originalLine = 0;
  let originalColumn = 0;
  let nameIndex = 0;

  const lines = mappings.split(';');
  const result = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    generatedLine = lineIdx + 1;
    generatedColumn = 0;

    if (!line) continue;

    const segments = line.split(',');
    for (const segment of segments) {
      if (!segment) continue;

      let match;
      let values = [];
      let shift = 0;
      let value = 0;

      for (let i = 0; i < segment.length; i++) {
        let integer = charToInteger[segment.charAt(i)];
        let hasContinuation = integer & 32;
        integer &= 31;
        value += integer << shift;

        if (hasContinuation) {
          shift += 5;
        } else {
          let shouldNegate = value & 1;
          value >>= 1;
          if (shouldNegate) {
            value = -value;
          }
          values.push(value);
          value = 0;
          shift = 0;
        }
      }

      generatedColumn += values[0];

      if (values.length > 1) {
        sourceIndex += values[1];
        originalLine += values[2];
        originalColumn += values[3];

        let name = null;
        if (values.length > 4) {
          nameIndex += values[4];
          name = rawMap.names ? rawMap.names[nameIndex] : null;
        }

        result.push({
          genLine: generatedLine,
          genCol: generatedColumn,
          source: rawMap.sources[sourceIndex],
          origLine: originalLine + 1,
          origCol: originalColumn,
          name
        });
      }
    }
  }
  return result;
}

console.log('Decoding sourcemap...');
const entries = decodeMappings(rawMap.mappings);
console.log('Total entries:', entries.length);

// Find entry near genLine 5181, genCol 49503
const targetLine = 5181;
const targetCol = 49503;

const lineEntries = entries.filter(e => e.genLine === targetLine);
console.log('Line entries count:', lineEntries.length);

// Sort by distance to targetCol
lineEntries.sort((a, b) => Math.abs(a.genCol - targetCol) - Math.abs(b.genCol - targetCol));

console.log('Closest 10 mappings to line 5181 col 49503:');
lineEntries.slice(0, 10).forEach(e => {
  console.log(`Gen [${e.genLine}:${e.genCol}] -> Source: ${e.source} [${e.origLine}:${e.origCol}] Name: ${e.name}`);
});
