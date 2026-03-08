@echo off
setlocal enabledelayedexpansion

set "OUTPUT=counts.json"

echo { > %OUTPUT%
set "firstDir=1"

for /d %%D in (*) do (
    set "folderName=%%~nxD"
    pushd "%%D"
    
    :: 1. Omvandla alla format (.png, .jpeg, .JPG) till små bokstäver .jpg
    if exist *.JPG rename *.JPG *.jpg 2>nul
    if exist *.jpeg rename *.jpeg *.jpg 2>nul
    if exist *.JPEG rename *.JPEG *.jpg 2>nul
    if exist *.png rename *.png *.jpg 2>nul
    if exist *.PNG rename *.PNG *.jpg 2>nul
    
    :: 2. Logik för att döpa om allt UTOM 01.jpg
    :: Vi använder en räknare som börjar på 2 för resten av bilderna
    set "imgIdx=2"
    
    for %%F in (*.jpg) do (
        :: Hoppa över 01.jpg
        if /i not "%%~nxF"=="01.jpg" (
            :: Skapa nytt namn (t.ex. 02.jpg, 03.jpg)
            set "newName=0!imgIdx!"
            set "newName=!newName:~-2!.jpg"
            
            :: Döpa om endast om filen inte redan heter rätt
            if /i not "%%~nxF"=="!newName!" (
                if not exist "!newName!" (
                    rename "%%~nxF" "!newName!"
                )
            )
            set /a imgIdx+=1
        )
    )
    
    :: 3. Räkna det slutgiltiga antalet .jpg-filer
    set "count=0"
    for %%F in (*.jpg) do (
        set /a count+=1
    )
    
    popd

    :: 4. Skriv till JSON-filen
    if !count! GTR 0 (
        if "!firstDir!"=="0" echo , >> %OUTPUT%
        echo    "!folderName!": !count! >> %OUTPUT%
        set "firstDir=0"
    )
)

echo } >> %OUTPUT%
echo Klart! Alla bilder är nu .jpg, 01.jpg