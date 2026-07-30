@echo off
title ManuscritoDaBruxos
cd /d "%~dp0"
echo.
echo  ManuscritoDaBruxos
echo  Iniciando em http://localhost:8080
echo  Mantenha esta janela aberta durante o uso.
echo.
start "" http://localhost:8080
py -m http.server 8080
if errorlevel 1 python -m http.server 8080
pause
