const multer = require("multer");
const express = require("express");
const archiver = require("archiver");
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

// if (!appName) {
//   return res.status(400).json({
//     error: "App Name Required",
//   });
// }

// if (!platform) {
//   return res.status(400).json({
//     error: "Platform Required",
//   });
// }


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

      io.emit("terminal-log", `\n🚀 Generating: ${appName}\n`);

      // ADD THIS
      const projectPath = path.join(__dirname, "../template-app");
      for (let i = 1; i <= 10; i++) {
        const key = `slide${i}`;

        if (req.files[key]) {
          const uploadedFile = req.files[key][0].path;

          // REPLACE SLIDE IMAGE

          const slideDestination = path.join(
            projectPath,
            `www/slide${i}/1.jpg`,
          );

          fs.copyFileSync(uploadedFile, slideDestination);

          // REPLACE THUMB IMAGE

          const thumbNumber = String(i).padStart(2, "0");

          const thumbDestination = path.join(
            projectPath,
            `www/thumbs/${thumbNumber}.jpg`,
          );

          fs.copyFileSync(uploadedFile, thumbDestination);

          console.log(`✅ Replaced slide${i}`);

          console.log(`✅ Replaced thumb ${thumbNumber}`);
        }
      }
      console.log("PROJECT PATH:", projectPath);

      // =======================
      // RUN BRAND SCRIPT
      // =======================

      const buildProcess = spawn("npm", ["run", "brand", "--", appName], {
        cwd: projectPath,
        shell: true,
      });

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
          buildProcessPlatform = spawn(
            "gradlew",
            ["assembleRelease", "--no-daemon"],
            {
              cwd: path.join(projectPath, "android"),
              shell: true,
            },
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

const zipPath = path.join(
  projectPath,
  "ios-build.zip"
);

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
            io.emit("terminal-log", "\n❌ APK Build Failed\n");

            return res.status(500).json({
              error: "APK Build Failed",
            });
          }

          console.log("✅ APK Build Complete");

          io.emit("terminal-log", "\n✅ APK Build Complete\n");

          if (platform === "ios") {
  const iosFolder = path.join(projectPath, "ios");

  await zipDirectory(
    iosFolder,
    outputFilePath
  );

  console.log("✅ iOS Project Zipped");
}

          // =======================
          // APK PATH
          // =======================

          const buildOutputPath = outputFilePath;

          console.log("BUILD PATH:", buildOutputPath);
          console.log("EXISTS:", fs.existsSync(buildOutputPath));

          // =======================
          // CHECK APK EXISTS
          // =======================

          if (!fs.existsSync(buildOutputPath)) {
            io.emit("terminal-log", "\n❌ APK Not Found\n");

            return res.status(500).json({
              error: "APK Not Found",
            });
          }

          // =======================
          // SAFE FILE NAME
          // =======================

         const buildId = generateBuildId();

const safeName =
  `${appName.replace(/[^a-zA-Z0-9]/g, "_")}_${buildId}`;

generatedFiles[safeName] = {
  buildId,
  path: buildOutputPath,
  extension: downloadExtension,
};

console.log("BUILD ID:", buildId);

// DOWNLOAD URL
const SERVER_IP = "192.168.1.23";
const downloadUrl =
  `http://${SERVER_IP}:5000/download/${safeName}.${downloadExtension}`;
          console.log({
            success: true,
            downloadUrl,
          });

          io.emit("terminal-log", "\n📦 APK Ready For Download\n");

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
  },
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
