@echo off
chcp 65001 >nul
echo ========================================================
echo    DONG BO CODE DTB BOT LEN GITHUB ^& REPLIT
echo ========================================================
echo.
set "PATH=D:\git\cmd;D:\nodejs;%PATH%"

cd /d "D:\bao\bao"

echo [+] Dang kiem tra thay doi...
git add -A

set /p msg="Nhap noi dung ghi chu cap nhat (Enter de de mac dinh): "
if "%msg%"=="" set msg=Update dtb bot files

git commit -m "%msg%"
if %errorlevel% neq 0 (
    echo [i] Khong co thay doi nao moi de cap nhat.
) else (
    echo [+] Dang day code len GitHub...
    git push origin main
    if %errorlevel% equ 0 (
        echo.
        echo ========================================================
        echo  [THANH CONG] Code da duoc day len GitHub!
        echo  Tren Replit, ban chi can go: git pull
        echo ========================================================
    ) else (
        echo.
        echo [!] Co loi khi day code len GitHub.
    )
)
echo.
pause
