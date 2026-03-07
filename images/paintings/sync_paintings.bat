@echo off
setlocal enabledelayedexpansion

set "OUTPUT=counts.json"

echo { > %OUTPUT%
set "firstDir=1"

for /d %%D in (*) do (
    set "folderName=%%~nxD"
    pushd "%%D"
    
    :: 1. Standardize extensions to lowercase .jpg first
    if exist *.JPG rename *.JPG *.jpg 2>nul
    if exist *.jpeg rename *.jpeg *.jpg 2>nul
    if exist *.JPEG rename *.JPEG *.jpg 2>nul
    
    :: 2. Logic to rename everything EXCEPT 01.jpg
    :: We use a temporary counter starting at 2
    set "imgIdx=2"
    
    for %%F in (*.jpg) do (
        :: Skip 01.jpg and skip any that are already correctly named 02, 03, etc.
        if /i not "%%~nxF"=="01.jpg" (
            :: Generate the next target name (e.g., 02, 03)
            set "newName=0!imgIdx!"
            set "newName=!newName:~-2!.jpg"
            
            :: Only rename if the file isn't already named correctly
            if /i not "%%~nxF"=="!newName!" (
                if not exist "!newName!" (
                    rename "%%~nxF" "!newName!"
                )
            )
            set /a imgIdx+=1
        )
    )
    
    :: 3. Count the final results
    set "count=0"
    for %%F in (*.jpg) do (
        set /a count+=1
    )
    
    popd

    :: 4. Write to JSON
    if !count! GTR 0 (
        if "!firstDir!"=="0" echo , >> %OUTPUT%
        echo   "!folderName!": !count! >> %OUTPUT%
        set "firstDir=0"
    )
)

echo } >> %OUTPUT%
echo Done! 01.jpg preserved, others renamed, and %OUTPUT% updated.
pause