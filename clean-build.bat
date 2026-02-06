@echo off
echo Cleaning Android build directories...

if exist "android\app\build" (
    echo Removing android\app\build...
    rmdir /s /q "android\app\build"
)

if exist "android\app\.cxx" (
    echo Removing android\app\.cxx...
    rmdir /s /q "android\app\.cxx"
)

if exist "android\build" (
    echo Removing android\build...
    rmdir /s /q "android\build"
)

echo Clean complete!

