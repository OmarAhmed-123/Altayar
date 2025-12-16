@echo off
setlocal enabledelayedexpansion

echo ========================================
echo ALTAYAR Flutter App Launcher
echo ========================================
echo.

echo Step 1: Stopping all Gradle Daemons...
cd android
call gradlew --stop >nul 2>&1
cd ..
timeout /t 2 >nul

echo Step 2: Killing all Java/Gradle/Kotlin/Flutter/Dart processes...
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq java.exe" /FO LIST ^| findstr /I "PID"') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq gradle.exe" /FO LIST ^| findstr /I "PID"') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq kotlinc.exe" /FO LIST ^| findstr /I "PID"') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq dart.exe" /FO LIST ^| findstr /I "PID"') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq flutter.exe" /FO LIST ^| findstr /I "PID"') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq adb.exe" /FO LIST ^| findstr /I "PID"') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
timeout /t 5 >nul

echo Step 3: Cleaning all caches and locks...
if exist "android\.gradle" (
    echo Removing android\.gradle directory
    rmdir /s /q "android\.gradle" 2>nul
)
if exist "E:\AltayarFlutter\gradle-cache" (
    echo Removing gradle-cache directory
    rmdir /s /q "E:\AltayarFlutter\gradle-cache" 2>nul
)
if exist ".gradle" (
    echo Removing .gradle directory
    rmdir /s /q ".gradle" 2>nul
)
if exist "build" (
    echo Removing build directory
    rmdir /s /q "build" 2>nul
)
if exist "android\app\build" (
    echo Removing android\app\build directory
    rmdir /s /q "android\app\build" 2>nul
)
if exist "android\build" (
    echo Removing android\build directory
    rmdir /s /q "android\build" 2>nul
)

echo Step 4: Cleaning Flutter build cache
flutter clean >nul 2>&1

echo Step 5: Setting up fresh Gradle cache
if not exist "E:\AltayarFlutter\gradle-cache" (
    mkdir "E:\AltayarFlutter\gradle-cache"
)
set GRADLE_USER_HOME=E:\AltayarFlutter\gradle-cache
set GRADLE_OPTS=-Dfile.encoding=UTF-8 -Duser.country=US -Duser.language=en

echo Step 6: Getting Flutter dependencies
flutter pub get >nul 2>&1

echo Step 7: Running Flutter App
echo Backend URL: http://192.168.1.4:5000/api
echo.
echo Note: If you encounter build errors, run fix_gradle.bat first
echo.
flutter run -d R95R500CV3D --dart-define=API_BASE_URL=http://192.168.1.4:5000/api

pause

/*
flutter run -d R58N72HV26Z --dart-define=API_BASE_URL=http://192.168.1.4:5000/api

R95R500CV3D
Flutter run key commands.
r Hot reload.
R Hot restart.
h List all available interactive commands.
d Detach (terminate "flutter run" but leave application running).
c Clear the screen
q Quit (terminate the application on the device).

E:\AltayarFlutter\Altayar>flutter run
Downloading windows-x64-debug/windows-x64-flutter tools...        234.0s
Downloading windows-x64/flutter-cpp-client-wrapper tools...        312ms
Downloading windows-x64-profile/windows-x64-flutter tools...        23.1s
Downloading windows-x64-release/windows-x64-flutter tools...        22.6s
Launching lib\main.dart on SM A515F in debug mode...
Picked up JAVA_TOOL_OPTIONS: -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8
Warning: Flutter support for your project's Gradle version (8.6.0) will soon be dropped. Please upgrade your Gradle version to a version of at least 8.7.0 soon.
Alternatively, use the flag "--android-skip-build-dependency-validation" to bypass this check.   

Potential fix: Your project's gradle version is typically defined in the gradle wrapper file. By 
default, this can be found at E:\AltayarFlutter\Altayar\android/gradle/wrapper/gradle-wrapper.properties.
For more information, see https://docs.gradle.org/current/userguide/gradle_wrapper.html.

Warning: Flutter support for your project's Android Gradle Plugin version (Android Gradle Plugin 
version 8.1.4) will soon be dropped. Please upgrade your Android Gradle Plugin version to a version of at least Android Gradle Plugin version 8.6.0 soon.
Alternatively, use the flag "--android-skip-build-dependency-validation" to bypass this check.

Potential fix: Your project's AGP version is typically defined in the plugins block of the `settings.gradle` file (E:\AltayarFlutter\Altayar\android/settings.gradle), by a plugin with the id of 
com.android.application.
If you don't see a plugins block, your project was likely created with an older template version. In this case it is most likely defined in the top-level build.gradle file (E:\AltayarFlutter\Altayar\android/build.gradle) by the following line in the dependencies block of the buildscript: "classpath 'com.android.tools.build:gradle:<version>'".

Warning: Flutter support for your project's Kotlin version (1.8.22) will soon be dropped. Please 
upgrade your Kotlin version to a version of at least 2.1.0 soon.
Alternatively, use the flag "--android-skip-build-dependency-validation" to bypass this check.   

Potential fix: Your project's KGP version is typically defined in the plugins block of the `settings.gradle` file (E:\AltayarFlutter\Altayar\android/settings.gradle), by a plugin with the id of 
org.jetbrains.kotlin.android.
If you don't see a plugins block, your project was likely created with an older template version, in which case it is most likely defined in the top-level build.gradle file (E:\AltayarFlutter\Altayar\android/build.gradle) by the ext.kotlin_version property.

Picked up JAVA_TOOL_OPTIONS: -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8

Picked up JAVA_TOOL_OPTIONS: -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8

Picked up JAVA_TOOL_OPTIONS: -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8

Running Gradle task 'assembleDebug'...                            941.5s
√ Built build\app\outputs\flutter-apk\app-debug.apk
Installing build\app\outputs\flutter-apk\app-debug.apk...              \

*/