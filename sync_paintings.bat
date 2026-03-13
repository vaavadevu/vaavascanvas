@echo off
setlocal enabledelayedexpansion

REM File synchronization for paintings folder
echo Synkroniserar paintings-mappen...

REM Change to paintings folder
cd /d "images\paintings"

set "OUTPUT=counts.json"
echo { > %OUTPUT%
set "firstDir=1"

for /d %%D in (*) do (
    set "folderName=%%~nxD"
    pushd "%%D"

    REM 1. Convert extensions to lowercase .jpg using Git
    for %%I in (*.JPG *.jpeg *.JPEG *.png *.PNG) do (
        if exist "..\..\..git" (
            git mv -f "%%I" "%%~nI.jpg" 2>nul
        ) else (
            rename "%%I" "%%~nI.jpg" 2>nul
        )
    )

    REM 2. Rename everything EXCEPT 01.jpg to sequential numbering
    set "imgIdx=2"
    for %%F in (*.jpg) do (
        if /i not "%%~nxF"=="01.jpg" (
            set "newName=0!imgIdx!"
            set "newName=!newName:~-2!.jpg"

            if /i not "%%~nxF"=="!newName!" (
                if not exist "!newName!" (
                    if exist "..\..\..git" (
                        git mv -f "%%~nxF" "!newName!" 2>nul
                    ) else (
                        rename "%%~nxF" "!newName!"
                    )
                )
            )
            set /a imgIdx+=1
        )
    )

    REM 3. Count final .jpg files
    set "count=0"
    for %%F in (*.jpg) do (
        set /a count+=1
    )

    popd

    REM 4. Write to JSON
    if !count! GTR 0 (
        if "!firstDir!"=="0" echo , >> %OUTPUT%
        echo    "!folderName!": !count! >> %OUTPUT%
        set "firstDir=0"
    )
)

echo } >> %OUTPUT%
echo.
echo Filsynkronisering klar!

REM Go back to root and run Python script
cd /d ..\..
echo.
echo Bearbetar bilder...
python "generate_mobile_images.py"

echo.
echo Allt klart!
pause
