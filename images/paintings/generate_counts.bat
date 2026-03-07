@echo off
setlocal enabledelayedexpansion
echo { > counts.json
set "first=1"

for /d %%D in (*) do (
    if "!first!"=="0" echo , >> counts.json
    set "count=0"
    for %%F in ("%%D\*.jpg") do set /a count+=1
    echo  "%%~nxD": !count! >> counts.json
    set "first=0"
)
echo } >> counts.json