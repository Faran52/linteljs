## Native builds

`{{RUN}} ios` and `{{RUN}} android` open the app in Expo Go. A development build compiles the native project
instead: `{{EXEC}} expo run:ios` or `{{EXEC}} expo run:android`.

- **iOS on Xcode 27.** Its SDK refuses to launch an app without the UIScene life cycle, which Expo SDK 57 adopts
  only on an opt-in: `app.json` sets `ios.enableSceneSupport` through `expo-build-properties`
  ([expo/expo#46664](https://github.com/expo/expo/issues/46664)). SDK 58 adopts it by default, so drop the
  option on that upgrade.
- **Android on any JDK from 17.** React Native builds on JDK 17; on 24 and later the CMake configure step fails on
  a restricted native method that Prefab calls. `src/config-plugins/with-gradle-daemon-jvm/` writes
  `android/gradle/gradle-daemon-jvm.properties` on every prebuild, so Gradle runs on JDK 17 whatever `JAVA_HOME`
  names, and downloads Temurin 17 where none is installed.
