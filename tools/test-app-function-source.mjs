// Extract named production function declarations without neighboring code markers.
function skipQuoted(source, index) {
  const quote = source[index];
  let cursor = index + 1;
  while (cursor < source.length) {
    if (source[cursor] === '\\') { cursor += 2; continue; }
    if (source[cursor] === quote) return cursor + 1;
    cursor += 1;
  }
  throw new Error('Unterminated quoted value while extracting app function');
}

function skipTrivia(source, index) {
  let cursor = index;
  while (cursor < source.length) {
    if (/\s/.test(source[cursor])) { cursor += 1; continue; }
    if (source.startsWith('//', cursor)) {
      const newline = source.indexOf('\n', cursor + 2);
      cursor = newline < 0 ? source.length : newline + 1;
      continue;
    }
    if (source.startsWith('/*', cursor)) {
      const end = source.indexOf('*/', cursor + 2);
      if (end < 0) throw new Error('Unterminated comment while extracting app function');
      cursor = end + 2;
      continue;
    }
    break;
  }
  return cursor;
}

function skipIgnored(source, index) {
  if (source[index] === "'" || source[index] === '"' || source[index] === String.fromCharCode(96)) {
    return skipQuoted(source, index);
  }
  if (source.startsWith('//', index)) {
    const newline = source.indexOf('\n', index + 2);
    return newline < 0 ? source.length : newline + 1;
  }
  if (source.startsWith('/*', index)) {
    const end = source.indexOf('*/', index + 2);
    if (end < 0) throw new Error('Unterminated comment while extracting app function');
    return end + 2;
  }
  return index;
}

// This scanner supports app.js's named function declarations; it is not a JavaScript parser.
function findDeclaration(source, name) {
  let cursor = 0;
  while (cursor < source.length) {
    const next = skipIgnored(source, cursor);
    if (next !== cursor) { cursor = next; continue; }
    if (source.startsWith('function', cursor)
      && (cursor === 0 || !/[A-Za-z0-9_$]/.test(source[cursor - 1]))
      && !/[A-Za-z0-9_$]/.test(source[cursor + 8])) {
      let nameStart = skipTrivia(source, cursor + 8);
      const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(source.slice(nameStart));
      if (identifier?.[0] === name) {
        const openParen = skipTrivia(source, nameStart + identifier[0].length);
        if (source[openParen] === '(') return { index: cursor, openParen };
      }
    }
    cursor += 1;
  }
  return null;
}

export function extractFunction(source, name) {
  const declaration = findDeclaration(source, name);
  if (!declaration) throw new Error('Missing production function declaration: ' + name);

  let cursor = declaration.openParen + 1;
  let parentheses = 1;
  while (cursor < source.length && parentheses > 0) {
    const next = skipIgnored(source, cursor);
    if (next !== cursor) { cursor = next; continue; }
    if (source[cursor] === '(') parentheses += 1;
    else if (source[cursor] === ')') parentheses -= 1;
    cursor += 1;
  }
  if (parentheses !== 0) throw new Error('Unterminated parameters for production function: ' + name);

  cursor = skipTrivia(source, cursor);
  if (source[cursor] !== '{') throw new Error('Missing body for production function: ' + name);
  let braces = 0;
  while (cursor < source.length) {
    const next = skipIgnored(source, cursor);
    if (next !== cursor) { cursor = next; continue; }
    if (source[cursor] === '{') braces += 1;
    else if (source[cursor] === '}') {
      braces -= 1;
      if (braces === 0) return source.slice(declaration.index, cursor + 1);
    }
    cursor += 1;
  }
  throw new Error('Unterminated body for production function: ' + name);
}
