export function parseWhatsAppList(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText.split(/\r?\n/);
  const players = [];

  const positionPatterns = [
    { pos: 'GK', regex: /\b(gk|goalie|keeper|goalkeeper|goal\s*keeper)\b/i },
    { pos: 'DEF', regex: /\b(cb|lb|rb|def|defender|defence|back)\b/i },
    { pos: 'MID', regex: /\b(cm|cdm|cam|mid|midfielder|midfield|wing|winger|lm|rm)\b/i },
    { pos: 'FWD', regex: /\b(st|cf|fwd|forward|striker|attack|attacker)\b/i },
    { pos: 'ANY', regex: /\b(any|anywhere|flex|flexible|all)\b/i }
  ];

  lines.forEach((line) => {
    let clean = line.trim();
    if (!clean) return;

    clean = clean.replace(/^[\(\[]?\d+[\)\]\.\-\:\*\s]+/i, '').trim();
    if (!clean) return;

    if (/^(players|list|turf|match|squad|confirmed|total|time|venue|location|date):?/i.test(clean)) {
      return;
    }

    let detectedPos = 'ANY';
    for (const p of positionPatterns) {
      if (p.regex.test(clean)) {
        detectedPos = p.pos;
        break;
      }
    }

    let playerName = clean
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[-–—]/g, ' ')
      .replace(/\b(gk|goalie|keeper|goalkeeper|cb|lb|rb|def|defender|cm|cdm|cam|mid|midfielder|st|cf|fwd|striker|any)\b/gi, '')
      .trim();

    playerName = playerName.replace(/^[\W_]+|[\W_]+$/g, '').trim();

    if (playerName.length >= 2) {
      players.push({
        id: 'p_' + Math.random().toString(36).substring(2, 9),
        name: playerName,
        position: detectedPos
      });
    }

  });

  return players;
}
