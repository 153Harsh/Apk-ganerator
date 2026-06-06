console.log("==========");
console.log("FILE:", __filename);
console.log("ARGV:", process.argv);
const { execSync } = require('child_process');
const { createCanvas } = require('canvas');
const fs = require('fs');


// ========================
// GET APP NAME
// ========================
const platform =
  process.argv[
    process.argv.length - 1
  ]?.toLowerCase();

const appName =
  process.argv
    .slice(2, -1)
    .join(" ");

console.log("APP:", appName);
console.log("PLATFORM:", platform);
console.log("==========");
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


  // GENERATE ICONS (optional)
  try {
    execSync(
      'npx capacitor-assets generate --android',
      {
        stdio: 'inherit',
        shell: true
      }
    );
  } catch (err) {
    console.warn(
      '⚠️ capacitor-assets generate failed (continuing branding):',
      err?.message || err
    );
  }

  // SYNC FIRST (optional)
  try {
    execSync(
      'npx cap sync android',
      {
        stdio: 'inherit',
        shell: true
      }
    );
  } catch (err) {
    console.warn(
      '⚠️ cap sync android failed (continuing branding):',
      err?.message || err
    );
  }

  // NOW UPDATE strings.xml
  const stringsPath =
    'android/app/src/main/res/values/strings.xml';

  // Some flows may run this script from a different folder; resolve relative paths.
  const resolvedStringsPath =
    fs.existsSync(stringsPath)
      ? stringsPath
      : `template-app/${stringsPath}`;

  // UPDATE AndroidManifest.xml
  const manifestPath =
    'android/app/src/main/AndroidManifest.xml';

  if (fs.existsSync(manifestPath)) {

    let manifest =
      fs.readFileSync(
        manifestPath,
        'utf8'
      );

    manifest = manifest.replace(
      /android:label="[^"]*"/,
      'android:label="@string/app_name"'
    );

    fs.writeFileSync(
      manifestPath,
      manifest
    );

    console.log(
      '✅ AndroidManifest Updated'
    );
  }

  // ADD DEBUG LOGS BEFORE CLEAN
  // UPDATE strings.xml (app_name)
  if (fs.existsSync(resolvedStringsPath)) {
    let stringsXml = fs.readFileSync(resolvedStringsPath, 'utf8');

    // Replace <string name="app_name">...</string>
    stringsXml = stringsXml.replace(
      /<string\s+name="app_name">[\s\S]*?<\/string>/,
      `<string name="app_name">${appName}</string>`
    );

    // Replace title_activity_main too (optional, same template style)
    stringsXml = stringsXml.replace(
      /<string\s+name="title_activity_main">[\s\S]*?<\/string>/,
      `<string name="title_activity_main">${appName}</string>`
    );

    fs.writeFileSync(resolvedStringsPath, stringsXml);
  }

  console.log(
    "===== STRINGS.XML ====="
  );

  console.log(
    fs.readFileSync(
      resolvedStringsPath,
      'utf8'
    )
  );

  console.log(
    "===== MANIFEST ====="
  );

  console.log(
    fs.readFileSync(
      'android/app/src/main/AndroidManifest.xml',
      'utf8'
    )
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



  const buildNumber =
    process.env.BUILD_ID ||
    Date.now().toString();
  
  const bundleId =
  `com.company.${buildNumber.toLowerCase()}`;

  const versionName =
    `1.0.${buildNumber.slice(-4)}`;
  const configJsPath =
    'capacitor.config.js';

  let configJs =
    fs.readFileSync(
      configJsPath,
      'utf8'
    );

  configJs = configJs.replace(
    /appId:\s*['"][^'"]+['"]/,
    `appId: '${bundleId}'`
  );

  configJs = configJs.replace(
    /appName:\s*['"][^'"]+['"]/,
    `appName: '${appName}'`
  );

  fs.writeFileSync(
    configJsPath,
    configJs
  );

  console.log(
    `✅ Updated App ID: ${bundleId}`
  );

  console.log(
    fs.readFileSync(
      configJsPath,
      'utf8'
    )
  );
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

    // BUILD VERSION
    plist =
      plist.replace(
        /<key>CFBundleVersion<\/key>\s*<string>.*?<\/string>/,
        `<key>CFBundleVersion</key>
<string>${buildNumber}</string>`
      );

    // APP VERSION
    plist =
      plist.replace(
        /<key>CFBundleShortVersionString<\/key>\s*<string>.*?<\/string>/,
        `<key>CFBundleShortVersionString</key>
<string>${versionName}</string>`
      );

    fs.writeFileSync(
      iosPath,
      plist
    );

    console.log(
      `✅ iOS App Name Updated: ${appName}`
    );

    console.log(
      `✅ iOS Version Updated: ${versionName}`
    );

    console.log(
      `✅ iOS Build Number Updated: ${buildNumber}`
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
console.log(
  "BUNDLE ID =",
  bundleId
);
const pbxprojPath =
  'ios/App/App.xcodeproj/project.pbxproj';

if (fs.existsSync(pbxprojPath)) {

  let pbxproj =
    fs.readFileSync(
      pbxprojPath,
      'utf8'
    );

  pbxproj = pbxproj.replace(
    /PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g,
    `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`
  );

  fs.writeFileSync(
    pbxprojPath,
    pbxproj
  );

  console.log(
    `✅ Bundle ID Updated: ${bundleId}`
  );
}
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