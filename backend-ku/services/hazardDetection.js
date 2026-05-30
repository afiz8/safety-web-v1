const hazardKeywords = {
  'Fire': ['kebakaran', 'api', 'terbakar', 'smoke', 'asap', 'ledakan'],
  'Explosion': ['meledak', 'ledakan', 'blast', 'explosion'],
  'Fall': ['jatuh', 'terjatuh', 'slip', 'terpeleset', 'height', 'ketinggian'],
  'Chemical': ['kimia', 'racun', 'toksik', 'chemical', 'hazardous', 'b3'],
  'Electrical': ['listrik', 'short circuit', 'konsleting', 'shock', 'tersengat'],
  'Machinery': ['mesin', 'alat berat', 'forklift', 'crane', 'conveyor'],
  'Collision': ['tabrakan', 'collision', 'benturan', 'tertindih'],
  'Health': ['kesehatan', 'sakit', 'medis', 'first aid', 'p3k']
};

const analyzeHazards = (text) => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const detected = [];
  for (const [hazard, keywords] of Object.entries(hazardKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detected.push(hazard);
    }
  }
  return [...new Set(detected)];
};

module.exports = { analyzeHazards };