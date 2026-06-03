const { createCanvas } = require('canvas');
const fs = require('fs');

const appName = process.argv[2] || 'AquaOat';

function getShortName(name) {
  // Remove extra spaces
  name = name.trim();

  // Multiple words
  // Quiz Flex → QF
  const words = name.split(/\s+/);

  if (words.length >= 2) {
    return (
      words[0][0] + words[1][0]
    ).toUpperCase();
  }

  // Single word
  // AquaOat → AQ
  const clean = name.replace(/[^a-zA-Z0-9]/g, '');

  if (clean.length >= 2) {
    return (
      clean[0] + clean[1]
    ).toUpperCase();
  }

  return clean.toUpperCase();
}

const shortName = getShortName(appName);

const size = 1024;

const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');


// TRANSPARENT BACKGROUND
ctx.clearRect(0, 0, size, size);


// Split letters
const chars = shortName.split('');


// TEXT SETTINGS
ctx.font = 'bold 420px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';


// FIRST LETTER → ORANGE
ctx.fillStyle = '#f97316';

ctx.fillText(
  chars[0] || '',
  size / 2 - 140,
  size / 2
);


// SECOND LETTER → BLUE
ctx.fillStyle = '#2563eb';

ctx.fillText(
  chars[1] || '',
  size / 2 + 140,
  size / 2
);


// SAVE PNG
const buffer = canvas.toBuffer('image/png');


// CREATE ASSETS FOLDER
if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets');
}


// SAVE ICON
fs.writeFileSync('assets/icon.png', buffer);

console.log(`Icon created with text: ${shortName}`);