@echo off
rem Fail-closed wrapper: if Python is missing or the guard errors, BLOCK (exit 2).
python "%~dp0floor_guard.py"
if errorlevel 1 exit /b 2
exit /b 0
