const express = require('express');
const cors = require('cors');

const {
  spawn
} = require('child_process');

const path = require('path');
const fs = require('fs');

const app = express();

const http =
  require('http').createServer(app);

const io =
  require('socket.io')(http, {
    cors: {
      origin: '*'
    }
  });


// =======================
// MIDDLEWARE
// =======================

app.use(cors());

app.use(express.json());


// =======================
// TEST ROUTE
// =======================

app.get('/', (req, res) => {

  res.send('🚀 Server Working');

});


// =======================
// GENERATE APK API
// =======================

app.post('/generate', async (req, res) => {

  try {

    const appName =
      req.body.appName?.trim();

    if (!appName) {

      return res.status(400).json({
        error: 'App Name Required'
      });
    }

    console.log(
      `🚀 Generating: ${appName}`
    );

    io.emit(
      'terminal-log',
      `\n🚀 Generating: ${appName}\n`
    );

    const projectPath =
      path.join(
        __dirname,
        '../template-app'
      );


    // =======================
    // RUN BRAND SCRIPT
    // =======================

    const buildProcess =
      spawn(
        'npm',
        ['run', 'brand', '--', appName],
        {
          cwd: projectPath,
          shell: true
        }
      );


    // =======================
    // BRAND STDOUT
    // =======================

    buildProcess.stdout.on(
      'data',
      (data) => {

        const log =
          data.toString();

        console.log(log);

        io.emit(
          'terminal-log',
          log
        );
      }
    );


    // =======================
    // BRAND STDERR
    // =======================

    buildProcess.stderr.on(
      'data',
      (data) => {

        const log =
          data.toString();

        console.log(log);

        io.emit(
          'terminal-log',
          log
        );
      }
    );


    // =======================
    // BRAND COMPLETE
    // =======================

    buildProcess.on(
      'close',
      (code) => {

        if (code !== 0) {

          io.emit(
            'terminal-log',
            '\n❌ Brand Script Failed\n'
          );

          return res.status(500).json({
            error:
              'Brand Script Failed'
          });
        }

        console.log(
          '✅ Branding Complete'
        );

        io.emit(
          'terminal-log',
          '\n✅ Branding Complete\n'
        );


        // =======================
        // BUILD RELEASE APK
        // =======================

        const gradleBuild =
          spawn(
            'gradlew',
            [
              'assembleRelease',
              '--no-daemon'
            ],
            {
              cwd: path.join(
                projectPath,
                'android'
              ),
              shell: true
            }
          );


        // =======================
        // GRADLE STDOUT
        // =======================

        gradleBuild.stdout.on(
          'data',
          (data) => {

            const log =
              data.toString();

            console.log(log);

            io.emit(
              'terminal-log',
              log
            );
          }
        );


        // =======================
        // GRADLE STDERR
        // =======================

        gradleBuild.stderr.on(
          'data',
          (data) => {

            const log =
              data.toString();

            console.log(log);

            io.emit(
              'terminal-log',
              log
            );
          }
        );


        // =======================
        // GRADLE COMPLETE
        // =======================

        gradleBuild.on(
          'close',
          (code) => {

            if (code !== 0) {

              io.emit(
                'terminal-log',
                '\n❌ APK Build Failed\n'
              );

              return res.status(500).json({
                error:
                  'APK Build Failed'
              });
            }

            console.log(
              '✅ APK Build Complete'
            );

            io.emit(
              'terminal-log',
              '\n✅ APK Build Complete\n'
            );


            // =======================
            // APK PATH
            // =======================

            const apkPath =
              path.join(
                projectPath,
                'android/app/build/outputs/apk/release/app-release.apk'
              );


            console.log(
              'APK PATH:',
              apkPath
            );

            console.log(
              'APK EXISTS:',
              fs.existsSync(apkPath)
            );


            // =======================
            // CHECK APK EXISTS
            // =======================

            if (
              !fs.existsSync(apkPath)
            ) {

              io.emit(
                'terminal-log',
                '\n❌ APK Not Found\n'
              );

              return res.status(500).json({
                error:
                  'APK Not Found'
              });
            }


            // =======================
            // SAFE FILE NAME
            // =======================

            const safeName =
              appName.replace(
                /[^a-zA-Z0-9]/g,
                '_'
              );


            // =======================
            // DOWNLOAD URL
            // =======================

            const downloadUrl =
              `https://cruciate-aria-overapprehensively.ngrok-free.dev/download/${safeName}.apk`;


            console.log({
              success: true,
              downloadUrl
            });


            io.emit(
              'terminal-log',
              '\n📦 APK Ready For Download\n'
            );


            // =======================
            // SEND RESPONSE
            // =======================

            res.json({
              success: true,
              downloadUrl
            });

          }
        );

      }
    );

  } catch (err) {

    console.log(err);

    io.emit(
      'terminal-log',
      `\n❌ ${err.message}\n`
    );

    res.status(500).json({
      error: err.message
    });
  }
});


// =======================
// DOWNLOAD APK
// =======================

app.get(
  '/download/:name',
  (req, res) => {

    try {

      const projectPath =
        path.join(
          __dirname,
          '../template-app'
        );

      const apkPath =
        path.join(
          projectPath,
          'android/app/build/outputs/apk/release/app-release.apk'
        );

      if (
        !fs.existsSync(apkPath)
      ) {

        return res
          .status(404)
          .send('APK Not Found');
      }

      res.setHeader(
        'Content-Type',
        'application/vnd.android.package-archive'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${req.params.name}"`
      );

      res.sendFile(apkPath);

    } catch (err) {

      console.log(err);

      res
        .status(500)
        .send('Download Failed');
    }
  }
);


// =======================
// SOCKET CONNECTION
// =======================

io.on(
  'connection',
  () => {

    console.log(
      '⚡ Client Connected'
    );
  }
);


// =======================
// START SERVER
// =======================

http.listen(5000, () => {

  console.log(
    '🚀 Server Running On Port 5000'
  );

});