const multer = require("multer");
const express = require("express");
const archiver = require("archiver");
console.log("ARCHIVER =", archiver);
console.log("TYPE =", typeof archiver);
const cors = require("cors");
const upload = multer({
  dest: "uploads/",
});
const { spawn } = require("child_process");

function generateBuildId() {
  return Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
}

function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", resolve);

    archive.on("error", reject);

    archive.pipe(output);

    archive.directory(sourceDir, false);

    archive.finalize();
  });
}

const generatedFiles = {};
const path = require("path");
const fs = require("fs");

const app = express();

const http = require("http").createServer(app);

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

// =======================
// MIDDLEWARE
// =======================

app.use(cors());

app.use(express.json());

// =======================
// TEST ROUTE
// =======================

app.get("/", (req, res) => {
  res.send("🚀 Server Working");
});

// =======================
// GENERATE APK API
// =======================

app.post(
  "/generate",
  upload.fields([
    { name: "slide1", maxCount: 1 },
    { name: "slide2", maxCount: 1 },
    { name: "slide3", maxCount: 1 },
    { name: "slide4", maxCount: 1 },
    { name: "slide5", maxCount: 1 },
    { name: "slide6", maxCount: 1 },
    { name: "slide7", maxCount: 1 },
    { name: "slide8", maxCount: 1 },
    { name: "slide9", maxCount: 1 },
    { name: "slide10", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log(
    "REQUEST RECEIVED",
    new Date().toISOString()
  );
    try {
      const appName = req.body.appName?.trim();
      const platform = req.body.platform?.trim()?.toLowerCase();

      if (!appName) {
        return res.status(400).json({
          error: "App Name Required",
        });
      }
      if (!platform) {
        return res.status(400).json({
          error: "Platform Required",
        });
      }
      
      console.log(`🚀 Generating ${platform}: ${appName}`);
      console.log(`🚀 Generating: ${appName}`);
      const buildId = generateBuildId();
      console.log("BUILD STARTED:", buildId);
      io.emit("terminal-log", `\n🚀 Generating: ${appName}\n`);

      // ADD THIS
      const projectPath = path.join(__dirname, "../template-app");
      
      // Check if project path exists
      if (!fs.existsSync(projectPath)) {
        io.emit("terminal-log", `\n❌ Project path not found: ${projectPath}\n`);
        return res.status(500).json({
          error: "Project path not found",
        });
      }
      
      // Clean up assets folder before starting to prevent permission errors
      const androidAssetsPath = path.join(projectPath, "android/app/src/main/assets");
      if (fs.existsSync(androidAssetsPath)) {
        try {
          fs.rmSync(androidAssetsPath, { recursive: true, force: true });
          io.emit("terminal-log", "✅ Cleaned up old assets folder\n");
        } catch (err) {
          io.emit("terminal-log", `⚠️ Could not clean assets folder: ${err.message}\n`);
        }
      }
      
      // Clean up cordova plugins folder
      // const cordovaPluginsPath = path.join(projectPath, "android/capacitor-cordova-android-plugins");
      // if (fs.existsSync(cordovaPluginsPath)) {
      //   try {
      //     fs.rmSync(cordovaPluginsPath, { recursive: true, force: true });
      //     io.emit("terminal-log", "✅ Cleaned up cordova plugins folder\n");
      //   } catch (err) {
      //     io.emit("terminal-log", `⚠️ Could not clean cordova plugins: ${err.message}\n`);
      //   }
      // }
      
      for (let i = 1; i <= 10; i++) {
        const key = `slide${i}`;

        if (req.files[key]) {
          const uploadedFile = req.files[key][0].path;

          // REPLACE SLIDE IMAGE
          const slideDestination = path.join(
            projectPath,
            `www/slide${i}/1.jpg`,
          );
          
          // Create directory if it doesn't exist
          const slideDir = path.dirname(slideDestination);
          if (!fs.existsSync(slideDir)) {
            fs.mkdirSync(slideDir, { recursive: true });
          }

          fs.copyFileSync(uploadedFile, slideDestination);

          // REPLACE THUMB IMAGE
          const thumbNumber = String(i).padStart(2, "0");
          const thumbDestination = path.join(
            projectPath,
            `www/thumbs/${thumbNumber}.jpg`,
          );
          
          // Create directory if it doesn't exist
          const thumbDir = path.dirname(thumbDestination);
          if (!fs.existsSync(thumbDir)) {
            fs.mkdirSync(thumbDir, { recursive: true });
          }

          fs.copyFileSync(uploadedFile, thumbDestination);

          console.log(`✅ Replaced slide${i}`);
          console.log(`✅ Replaced thumb ${thumbNumber}`);
        }
      }
      console.log("PROJECT PATH:", projectPath);

      // =======================
      // RUN BRAND SCRIPT - FIXED ARGUMENT PASSING
      // =======================
      
      // Pass the app name as a single argument without "--"
      const buildProcess = spawn(
  "npm",
  ["run", "brand", appName, platform],
  {
    cwd: projectPath,
    shell: true,
  }
);

      // =======================
      // BRAND STDOUT
      // =======================

      buildProcess.stdout.on("data", (data) => {
        const log = data.toString();
        console.log(log);
        io.emit("terminal-log", log);
      });

      // =======================
      // BRAND STDERR
      // =======================

      buildProcess.stderr.on("data", (data) => {
        const log = data.toString();
        console.log(log);
        io.emit("terminal-log", log);
      });

      // =======================
      // BRAND COMPLETE
      // =======================

      buildProcess.on("close", (code) => {
        if (code !== 0) {
          io.emit("terminal-log", "\n❌ Brand Script Failed\n");
          return res.status(500).json({
            error: "Brand Script Failed",
          });
        }

        console.log("✅ Branding Complete");
        io.emit("terminal-log", "\n✅ Branding Complete\n");

        // =======================
        // BUILD RELEASE APK
        // =======================

        let buildProcessPlatform;
        let outputFilePath;
        let downloadExtension;

        if (platform === "android") {
          const packageName = `com.company.app${buildId.toLowerCase()}`;

          const gradlePath = path.join(
            projectPath,
            "android/app/build.gradle"
          );

          let gradleContent = fs.readFileSync(
            gradlePath,
            "utf8"
          );

          gradleContent = gradleContent.replace(
            /applicationId\s+"[^"]+"/,
            `applicationId "${packageName}"`
          );
          
          const versionCode = Math.floor(Date.now() / 1000);
          gradleContent = gradleContent.replace(
            /versionCode\s+\d+/,
            `versionCode ${versionCode}`
          );
          
          gradleContent = gradleContent.replace(
            /versionName\s+"[^"]+"/,
            `versionName "${buildId}"`
          );
          
          fs.writeFileSync(gradlePath, gradleContent);

          buildProcessPlatform = spawn(
            "gradlew",
            ["assembleRelease", "--no-daemon"],
            {
              cwd: path.join(projectPath, "android"),
              shell: true,
            }
          );

          outputFilePath = path.join(
            projectPath,
            "android/app/build/outputs/apk/release/app-release.apk",
          );

          downloadExtension = "apk";
        } else if (platform === "ios") {
          buildProcessPlatform = spawn("npx", ["cap", "sync", "ios"], {
            cwd: projectPath,
            shell: true,
          });

          const iosFolder = path.join(projectPath, "ios");
          const zipPath = path.join(projectPath, "ios-build.zip");
          outputFilePath = zipPath;
          downloadExtension = "zip";
        } else {
          return res.status(400).json({
            error: `Unsupported platform: ${platform}`,
          });
        }

        // =======================
        // GRADLE STDOUT
        // =======================

        buildProcessPlatform.stdout.on("data", (data) => {
          const log = data.toString();
          console.log(log);
          io.emit("terminal-log", log);
        });

        // =======================
        // GRADLE STDERR
        // =======================

        buildProcessPlatform.stderr.on("data", (data) => {
          const log = data.toString();
          console.log(log);
          io.emit("terminal-log", log);
        });

        // =======================
        // GRADLE COMPLETE
        // =======================

        buildProcessPlatform.on("close", async (code) => {
          if (code !== 0) {
            io.emit("terminal-log", "\n❌ Build Failed\n");
            return res.status(500).json({
              error: "Build Failed",
            });
          }

          console.log("✅ Build Complete");
          io.emit("terminal-log", "\n✅ Build Complete\n");

          if (platform === "ios") {
            const iosFolder = path.join(projectPath, "ios");
            await zipDirectory(iosFolder, outputFilePath);
            console.log("✅ iOS Project Zipped");
          }

          // =======================
          // BUILD OUTPUT PATH
          // =======================

          const buildOutputPath = outputFilePath;
          console.log("BUILD PATH:", buildOutputPath);
          console.log("EXISTS:", fs.existsSync(buildOutputPath));

          // =======================
          // CHECK FILE EXISTS
          // =======================

          if (!fs.existsSync(buildOutputPath)) {
            io.emit("terminal-log", "\n❌ Build file not found\n");
            return res.status(500).json({
              error: "Build file not found",
            });
          }

          // =======================
          // SAFE FILE NAME
          // =======================

          const safeName = `${appName.replace(/[^a-zA-Z0-9]/g, "_")}_${buildId}`;
          
          generatedFiles[safeName] = {
            buildId,
            path: buildOutputPath,
            extension: downloadExtension,
          };

          console.log("BUILD ID:", buildId);

          // DOWNLOAD URL - Make this dynamic or configurable
          const SERVER_IP = "10.237.148.126"; // Consider moving to environment variable
          const downloadUrl = `http://${SERVER_IP}:5000/download/${safeName}.${downloadExtension}`;
          
          console.log({
            success: true,
            downloadUrl,
          });

          io.emit("terminal-log", "\n📦 File Ready For Download\n");

          // =======================
          // SEND RESPONSE
          // =======================

          res.json({
            success: true,
            buildId,
            platform,
            downloadUrl,
          });
        });
      });
    } catch (err) {
      console.log(err);
      io.emit("terminal-log", `\n❌ ${err.message}\n`);
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// =======================
// DOWNLOAD APK
// =======================
app.get("/download/:name.:ext", (req, res) => {
  const fileInfo = generatedFiles[req.params.name];

  if (!fileInfo) {
    return res.status(404).send("File Not Found");
  }

  if (req.params.ext !== fileInfo.extension) {
    return res.status(400).send("Invalid Extension");
  }

  res.download(
    fileInfo.path,
    `${req.params.name}.${fileInfo.extension}`
  );
});

// =======================
// SOCKET CONNECTION
// =======================

io.on("connection", () => {
  console.log("⚡ Client Connected");
});

// =======================
// START SERVER
// =======================

http.listen(5000, () => {
  console.log("🚀 Server Running On Port 5000");
});