## Native builds

`{{RUN}} ios` and `{{RUN}} android` open the app in Expo Go. A development build compiles the native project
instead: `{{EXEC}} expo run:ios` or `{{EXEC}} expo run:android`.

- **iOS on Xcode 27.** Its SDK refuses to launch an app without the UIScene life cycle, which Expo SDK 57 adopts
  only on an opt-in: `app.json` sets `ios.enableSceneSupport` through `expo-build-properties`
  ([expo/expo#46664](https://github.com/expo/expo/issues/46664)). SDK 58 adopts it by default, so drop the
  option on that upgrade.
- **Android on JDK 25.** The CMake configure step fails on a restricted native method. Run the build with
  `JAVA_TOOL_OPTIONS=--enable-native-access=ALL-UNNAMED` set. No committed file carries it: `expo prebuild`
  rewrites `android/gradle.properties`, and `expo-build-properties` passes no JVM arguments.
