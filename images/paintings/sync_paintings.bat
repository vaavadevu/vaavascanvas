@echo off
setlocal enabledelayedexpansion

:: The name of the file to create
set "OUTPUT=counts.json"

echo { > %OUTPUT%
set "firstDir=1"

:: Loop through every item in the current folder
for /d %%D in (*) do (
    
    :: Skip the current directory symbols
    set "folderName=%%~nxD"
    
    :: Move into the painting folder (e.g., radjur)
    pushd "%%D"
    
    :: 1. Rename variations to lowercase .jpg (standardizing)
    if exist *.JPG rename *.JPG *.jpg 2>nul
    if exist *.jpeg rename *.jpeg *.jpg 2>nul
    if exist *.JPEG rename *.JPEG *.jpg 2>nul
    
    :: 2. Count ONLY .jpg files
    set "count=0"
    for %%F in (*.jpg) do (
        set /a count+=1
    )
    
    popd

    :: 3. Write to the JSON file
    if !count! GTR 0 (
        if "!firstDir!"=="0" (
            echo , >> %OUTPUT%
        )
        echo   "!folderName!": !count! >> %OUTPUT%
        set "firstDir=0"
    )
)

echo } >> %OUTPUT%

echo Done! Standardized images and updated %OUTPUT% with !firstDir! folders found.
pause