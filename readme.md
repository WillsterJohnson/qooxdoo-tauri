[useBun]: #node-module_not_found-error
[prerequisites]: https://v2.tauri.app/start/prerequisites/
[tauri-x-compile]: https://tauri.app/v1/guides/building/cross-platform/
[tauri-discuss-build-all]: https://github.com/tauri-apps/tauri/discussions/4528

# ter.wills

A demo application using Tauri for cross-platform native app deployment

## Build

Errors in build? You may be missing packages, check the
[prerequisites][prerequisites] for your platform.

You may also need to install the javascript runtime 'bun' as it provides better
stability when building for android. See the [Node `MODULE_NOT_FOUND` Error][useBun]
section for more information.

Finally, make sure that all javascript dependencies are installed.

```bash
pnpm i # or `npm i` or `yarn`
```

To build for the OS you are currently on;

```bash
pnpm tauri build # or `npm tauri build` or `yarn tauri build`
```

To build for android;

```bash
pnpm tauri android build # or `npm tauri android build` or `yarn tauri android build`
```

Building for platforms other than the one you are currently on will require some
additional setup. See the [tauri documentation][tauri-x-compile] for more
information on building in a github action, or
[this github discussion][tauri-discuss-build-all] for building in docker.

## Using This Template

> [!NOTE]
> The following steps can also be used to add tauri deployment to an existing
> qooxdoo application. Add the `"@tauri-apps/cli": ">=2.0.0-beta.0"` package to
> your project's dev dependencies and follow the steps below.

### Configure Tauri

```sh
pnpm tauri init --force # or `npm tauri init --force` or `yarn tauri init --force`
```

When prompted, enter the following responses:

- What is your app name?
  - (your application name)
- What should the window title be?
  - (title of your app window)
- Where are your web assets (HTML/CSS/JS) located, relative to the "<current dir>/src-tauri/tauri.conf.json" file that will be created?
  - `../compiled/build`
- What is the url of your dev server?
  - `http://localhost:5173`
- What is your frontend dev command?
  - `npm run dev`
- What is your frontend build command?
  - `npm run build`

Open the `src-tauri/tauri.conf.json` file and update the `identifier` field to
match your application's reverse domain name.

```diff
- "identifier": "com.example"
+ "identifier": "com.yourdomain.yourapp"
```

Then to update the android configurations, run the following commands:

```sh
rm -rf src-tauri/gen/android
pnpm tauri android init # or `npm tauri android init` or `yarn tauri android init`
```

> [!NOTE]
> This template has yet to be tested for iOS builds. Follow tauri's
> documentation for more information.

### Signing Android Builds

> [!NOTE]
> If you delete and regenerate the `gen/android` directory, you will need to
> repeat everything in this section.

There is an [archived version of tauri's documentation][tauri-signing] that
provides a similar guide to the following steps.

[tauri-signing]: https://web.archive.org/web/20240222072319/https://next--tauri.netlify.app/next/guides/distribution/sign-android/

To sign your android builds, you will need to create a keystore file. Run the
following command to create a keystore file.

```sh
keytool -genkey -v -keystore $HOME/upload-keystore.jks -keyalg RSA -keysize 2048 -va
```

> [!TIP]
> If an error occurs where `keytool` is not found, it may be missing from your
> PATH. Either add `$JAVA_HOME/bin` to your PATH or use the full path to the
> `keytool` executable (eg, `/opt/android-studio/jbr/bin/keytool`).

When prompted, enter the following responses:

- Enter keystore password:
  - a secure password (remember this for later)
- Re-enter new password:
  - the same password
- What is your first and last name?
  - optional, may leave blank
- What is the name of your organizational unit?
  - optional, may leave blank
- What is the name of your organization?
  - optional, may leave blank
- What is the name of your City or Locality?
  - optional, may leave blank
- What is the name of your State or Province?
  - optional, may leave blank
- What is the two-letter country code for this unit?
  - `UK`, `DE`, `FR`, etc.; whichever applies
- Is CN=Unknown, ... correct?
  - `yes`

Then create and populate the `src-tauri/gen/android/keystore.properties` file.

```sh
touch src-tauri/gen/android/keystore.properties
echo "storePassword=your password here" >> src-tauri/gen/android/keystore.properties
echo "keyPassword=your password here" >> src-tauri/gen/android/keystore.properties
echo "keyAlias=upload" >> src-tauri/gen/android/keystore.properties
echo "storeFile=/home/<username>/upload-keystore.jks" >> src-tauri/gen/android/keystore.properties
```

Then in `src-tauri/gen/android/app/build.gradle.kts`, add the signing configuration.

> [!TIP]
> If you are having trouble getting the signing configuration to work, copy the
> contents of the file from this repo, as it has already been configured.

```diff
import java.util.Properties
+ import java.io.FileInputStream

...

+ val keyPropertiesFile = rootProject.file("key.properties")
+ val keyProperties = Properties()
+ keyProperties.load(FileInputStream(keyPropertiesFile))

android {
    defaultConfig {
        ...
    }
+   signingConfigs {
+       create("release") {
+         keyAlias = keyProperties["keyAlias"] as String
+         keyPassword = keyProperties["keyPassword"] as String
+         storeFile = file(keyProperties["storeFile"] as String)
+         storePassword = keyProperties["storePassword"] as String
+       }
+   }
    buildTypes {
        ...
        getByName("release") {
            isMinifyEnabled = true
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
+           signingConfig = signingConfigs.getByName("release")
        }
    }
}

...
```

### Node `MODULE_NOT_FOUND` Error

> [!NOTE]
> If you delete and regenerate the `gen/android` directory, you will need to
> repeat everything in this section.

If node throws a `MODULE_NOT_FOUND` error when running the `tauri android build`
command, the simplest solution is to instead use the `bun` javascript runtime.

```sh
npm i -g bun
```

Then update
`./src-tauri/gen/android/buildSrc/src/main/java/com/tauri/dev/kotlin/BuildTask.kt`
to use the `bun` runtime.

```diff
...
    @TaskAction
    fun assemble() {
-       val executable = """node""";
+       val executable = """bun""";
        try {
            runTauriCli(executable)
        } catch (e: Exception) {
            if (Os.isFamily(Os.FAMILY_WINDOWS)) {
                runTauriCli("$executable.cmd")
            } else {
                throw e;
            }
        }
    }
...
```
