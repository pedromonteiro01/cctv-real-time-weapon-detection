@echo off

REM define the Python modules and versions
set modules="requests==2.28.0" "tqdm==4.64.0" "pytest==7.1.1" "torch==1.12.0" "matplotlib==3.4.2" "pyyaml==5.4.1" "opencv-python==4.5.2.52"

REM install each module
FOR %%i IN (%modules%) DO (
    echo Installing %%i...
    pip install %%i
)

echo All modules installed successfully.
pause
