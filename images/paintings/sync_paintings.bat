@echo off
setlocal enabledelayedexpansion

set "OUTPUT=counts.json"
echo { > %OUTPUT%
set "firstDir=1"

:: Path to the Git root from the paintings folder (2 levels up)
set "GIT_ROOT=..\.."

for /d %%D in (*) do (
    set "folderName=%%~nxD"
    pushd "%%D"
    
    :: 1. Convert extensions to lowercase .jpg using Git
    :: We use "git -C" to tell git where the repo root is
    for %%I in (*.JPG *.jpeg *.JPEG *.png *.PNG) do (
        if exist "%GIT_ROOT%\.git" (
            git mv -f "%%I" "%%~nI.jpg" 2>nul
        ) else (
            rename "%%I" "%%~nI.jpg" 2>nul
        )
    )
    
    :: 2. Logic to rename everything EXCEPT 01.jpg
    set "imgIdx=2"
    for %%F in (*.jpg) do (
        if /i not "%%~nxF"=="01.jpg" (
            set "newName=0!imgIdx!"
            set "newName=!newName:~-2!.jpg"
            
            if /i not "%%~nxF"=="!newName!" (
                if not exist "!newName!" (
                    if exist "%GIT_ROOT%\..\.git" (
                        :: We are now 3 levels deep from the .git folder
                        git mv -f "%%~nxF" "!newName!" 2>nul
                    ) else (
                        rename "%%~nxF" "!newName!"
                    )
                )
            )
            set /a imgIdx+=1
        )
    )
    
    :: 3. Count final .jpg files
    set "count=0"
    for %%F in (*.jpg) do (
        set /a count+=1
    )
    
    popd

    :: 4. Write to JSON
    if !count! GTR 0 (
        if "!firstDir!"=="0" echo , >> %OUTPUT%
        echo    "!folderName!": !count! >> %OUTPUT%
        set "firstDir=0"
    )
)

echo } >> %OUTPUT%
echo.
echo Klart! Files renamed and Git index updated.
echo Run 'git status' to see the staged changes.
pause