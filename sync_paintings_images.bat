@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

REM Den har filen ar sparad i UTF-8 (utan BOM) och innehaller a-ring och
REM prickar. En konsol star normalt i kodsida 437 eller 850, och da blir de
REM tecknen grot pa skarmen. Vi byter till UTF-8 (65001) medan scriptet kor och
REM staller tillbaka efterat, sa att ett fonster man kort scriptet i inte blir
REM kvar i fel lage. Samma byte gor att utskrifterna fran python- och
REM node-scripten visas ratt, de skriver ocksa UTF-8.
set "GAMMAL_CP="
for /f "tokens=2 delims=:" %%A in ('chcp') do (
    for /f "tokens=1 delims=. " %%B in ("%%A") do set "GAMMAL_CP=%%B"
)
chcp 65001 > nul

title Vaavascanvas - Bilder och data

REM Bygger om bilderna i images\paintings och allt som härleds ur dem.
REM
REM Ett inkrementellt bygge är bara säkert om det går att bevisa efteråt, så
REM varje val här slutar likadant: counts.json och metadata.json byggs om från
REM hela katalogen, data för klient och server genereras om, och till sist
REM kontrolleras varje målning mot sina originalbilder. Ligger något i otakt
REM säger scriptet ifrån istället för att sluta tyst.

:menu
cls
echo ==================================================
echo  VAAVASCANVAS - BILDER OCH DATA
echo ==================================================
echo.
echo Jämför bilderna med förra körningen...

REM Planen visas före menyn, så valet [1] görs med vetskap om vad det gör.
REM Bägge scripten rör ingenting i det här läget.
python -u "scripts\generate_mobile_images.py" --plan
if errorlevel 1 goto misslyckades
node "scripts\stub-new-paintings.js" --plan
if errorlevel 1 goto misslyckades

echo ==================================================
echo.
echo   [1] Synka det ovan                 (rekommenderas)
echo   [2] En enda målning
echo   [3] Allt från grunden              (tar flera minuter)
echo   [4] Kontrollera bara, ändra ingenting
echo.
echo   [0] Avbryt
echo.

set "val="
set /p "val=Val [1]: "
REM Bara första tecknet: då spelar det ingen roll om raden bär med sig
REM ett vagnreturtecken eller om något råkat komma med efter siffran
if not "!val!"=="" set "val=!val:~0,1!"
if "!val!"=="" set "val=1"

if "!val!"=="0" goto avbrutet
if "!val!"=="1" goto kor_andrade
if "!val!"=="2" goto valj_malning
if "!val!"=="3" goto kor_allt
if "!val!"=="4" goto kor_kontroll

echo.
echo Välj 0, 1, 2, 3 eller 4.
echo.
pause
goto menu

:valj_malning
echo.
echo Målningar i images\paintings:
echo.
for /d %%D in ("images\paintings\*") do echo    %%~nxD
echo.
set "malning="
set /p "malning=Vilken målning (mappnamnet): "
if "!malning!"=="" (
    echo.
    echo Inget namn angivet.
    echo.
    pause
    goto menu
)
set "LAGE=--only !malning!"
goto kor

:kor_andrade
set "LAGE="
goto kor

:kor_allt
set "LAGE=--all"
goto kor

:kor_kontroll
set "LAGE=--check"
goto kor

:kor
echo.
echo ==================================================
echo Bearbetar bilder...
echo ==================================================
echo.
python -u "scripts\generate_mobile_images.py" !LAGE!
if errorlevel 1 goto misslyckades

REM Kontrolläget ska inte skriva några filer alls
if "!val!"=="4" goto kontrollera_data

echo.
echo ==================================================
echo Letar efter målningar som saknas i paintings.json...
echo ==================================================
echo.
node "scripts\stub-new-paintings.js"
set "KOD=!errorlevel!"
if "!KOD!"=="1" goto misslyckades
if "!KOD!"=="2" set "NYA=1"

echo.
echo ==================================================
echo Genererar data för klient och server...
echo ==================================================
echo.
call npm run build
if errorlevel 1 goto misslyckades

echo.
echo ==================================================
echo Kontrollerar bildstrukturen...
echo ==================================================
echo.
python -u "scripts\validate_images.py"
if errorlevel 1 goto misslyckades

echo.
echo ==================================================
echo ALLT KLART
echo ==================================================
echo.
if defined NYA (
    echo  ^>^> Nya målningar lades till i data\paintings.json med placeholders.
    echo  ^>^> Fyll i raderna som är markerade med "_todo" - se listan ovan.
    echo.
)
echo Kör "npm test" innan du publicerar - den kontrollerar att
echo bilder, data och priser hänger ihop.
echo.
pause
set "UT=0"
goto slut

:kontrollera_data
echo.
echo ==================================================
echo Kontrollerar data\paintings.json...
echo ==================================================
echo.
node "scripts\stub-new-paintings.js" --check
set "KOD=!errorlevel!"
if "!KOD!"=="1" goto misslyckades
if "!KOD!"=="2" goto klart_kontroll_saknas
goto klart_kontroll

:klart_kontroll_saknas
echo.
echo ==================================================
echo BILDERNA STÄMMER, MEN DATA SAKNAS - se listan ovan
echo ==================================================
echo.
pause
set "UT=0"
goto slut

:klart_kontroll
echo.
echo ==================================================
echo INGET LIGGER I OTAKT
echo ==================================================
echo.
pause
set "UT=0"
goto slut

:misslyckades
echo.
echo ==================================================
echo NÅGOT GICK FEL - se meddelandet ovan
echo ==================================================
echo.
echo Hjälper inget annat: kör om och välj [3] Allt från grunden.
echo.
pause
set "UT=1"
goto slut

:avbrutet
echo.
echo Avbrutet - ingenting ändrades.
echo.
set "UT=0"
goto slut

:slut
REM Lämna tillbaka konsolen i den kodsida den stod i
if defined GAMMAL_CP chcp !GAMMAL_CP! > nul
exit /b !UT!
