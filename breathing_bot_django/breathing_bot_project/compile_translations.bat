@echo off
echo Compiling translations...
REM Temporarily add the local bin folder to the PATH for this session
set PATH=%PATH%;%~dp0bin

REM Run the Django command
python manage.py compilemessages

echo Done!
pause