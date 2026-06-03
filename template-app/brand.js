const { execSync } = require('child_process');
const { createCanvas } = require('canvas');
const fs = require('fs');


// ========================
// GET APP NAME
// ========================

const appName =
  process.argv[2] || 'AquaOat';

const platform =
  process.argv[3]?.toLowerCase();


// ========================
// PLATFORM CHECK
// ========================

const isWindows =
  process.platform === 'win32';

const isMac =
  process.platform === 'darwin';


// ========================
// SHORT NAME LOGIC
// ========================

function getShortName(name) {

  name = name.trim();

  const words =
    name.split(/\s+/);

  // Quiz Flex → QF
  if (words.length >= 2) {

    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase();
  }

  // AquaOat → AQ
  const clean =
    name.replace(/[^a-zA-Z0-9]/g, '');

  if (clean.length >= 2) {

    return (
      clean[0] +
      clean[1]
    ).toUpperCase();
  }

  return clean.toUpperCase();
}

const shortName =
  getShortName(appName);


// ========================
// CREATE ICON
// ========================

const size = 1024;

const canvas =
  createCanvas(size, size);

const ctx =
  canvas.getContext('2d');


// TRANSPARENT BACKGROUND
ctx.clearRect(
  0,
  0,
  size,
  size
);


// LETTERS
const chars =
  shortName.split('');

ctx.font =
  'bold 420px Arial';

ctx.textAlign =
  'center';

ctx.textBaseline =
  'middle';


// FIRST LETTER
ctx.fillStyle =
  '#f97316';

ctx.fillText(
  chars[0] || '',
  size / 2 - 140,
  size / 2
);


// SECOND LETTER
ctx.fillStyle =
  '#2563eb';

ctx.fillText(
  chars[1] || '',
  size / 2 + 140,
  size / 2
);


// CREATE ASSETS FOLDER
if (!fs.existsSync('assets')) {

  fs.mkdirSync('assets');
}


// SAVE ICON
const buffer =
  canvas.toBuffer('image/png');

fs.writeFileSync(
  'assets/icon.png',
  buffer
);

console.log(
  `✅ Icon Generated: ${shortName}`
);


// ========================
// UPDATE CAPACITOR CONFIG
// ========================

const capacitorConfigPath =
  'capacitor.config.json';

if (
  fs.existsSync(
    capacitorConfigPath
  )
) {

  const config =
    JSON.parse(
      fs.readFileSync(
        capacitorConfigPath,
        'utf8'
      )
    );

  config.appName =
    appName;

  fs.writeFileSync(
    capacitorConfigPath,
    JSON.stringify(
      config,
      null,
      2
    )
  );

  console.log(
    '✅ Capacitor Config Updated'
  );
}


// ========================
// WINDOWS → ANDROID ONLY
// ========================

if (platform === "android") {

  console.log(
    '🟢 WINDOWS DETECTED'
  );

  // UPDATE ANDROID NAME

  const stringsPath =
    'android/app/src/main/res/values/strings.xml';

  if (
    fs.existsSync(stringsPath)
  ) {

    let strings =
      fs.readFileSync(
        stringsPath,
        'utf8'
      );

    // app_name
    strings =
      strings.replace(
        /<string name="app_name">.*?<\/string>/,
        `<string name="app_name">${appName}</string>`
      );

    // title_activity_main
    strings =
      strings.replace(
        /<string name="title_activity_main">.*?<\/string>/,
        `<string name="title_activity_main">${appName}</string>`
      );

    fs.writeFileSync(
      stringsPath,
      strings
    );

    console.log(
      '✅ Android App Name Updated'
    );
  }


  // GENERATE ANDROID ICONS
  execSync(
    'npx capacitor-assets generate --android',
    {
      stdio: 'inherit',
      shell: true
    }
  );


  // SYNC ANDROID
  execSync(
    'npx cap sync android',
    {
      stdio: 'inherit',
      shell: true
    }
  );


  // CLEAN ANDROID
  execSync(
    'cd android && gradlew clean',
    {
      stdio: 'inherit',
      shell: true
    }
  );

  console.log(
    '✅ Android Complete'
  );
}


// ========================
// MAC → IOS ONLY
// ========================

if (platform === "ios") {

  console.log(
    '🍎 MAC DETECTED'
  );

  // UPDATE IOS APP NAME

  const iosPath =
    'ios/App/App/Info.plist';

  if (
    fs.existsSync(iosPath)
  ) {

    let plist =
      fs.readFileSync(
        iosPath,
        'utf8'
      );

    // DISPLAY NAME
    plist =
      plist.replace(
        /<key>CFBundleDisplayName<\/key>\s*<string>.*?<\/string>/,
        `<key>CFBundleDisplayName</key>
<string>${appName}</string>`
      );

    // BUNDLE NAME
    plist =
      plist.replace(
        /<key>CFBundleName<\/key>\s*<string>.*?<\/string>/,
        `<key>CFBundleName</key>
<string>${appName}</string>`
      );

    fs.writeFileSync(
      iosPath,
      plist
    );

    console.log(
      '✅ iOS App Name Updated'
    );
  }


  // GENERATE IOS ICONS
  execSync(
    'npx capacitor-assets generate --ios',
    {
      stdio: 'inherit',
      shell: true
    }
  );


  // SYNC IOS
  execSync(
    'npx cap sync ios',
    {
      stdio: 'inherit',
      shell: true
    }
  );

  console.log(
    '✅ iOS Complete'
  );
}


console.log(
  '🚀 Branding Complete!'
);