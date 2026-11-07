@echo off
chcp 65001 > nul
title DTB BOT SYSTEM - CHẠY TRỰC TIẾP TRÊN IP MÁY DÂN CƯ

echo ================================================================================
echo                     DTB BOT - KHỞI ĐỘNG TRỰC TIẾP TRÊN MÁY TÍNH
echo ================================================================================
echo [*] Trạng thái: Đang kết nối trực tiếp bằng IP máy cá nhân (Khớp trình duyệt FB)
echo [*] Chế độ: Giảm thiểu tối đa nguy cơ Facebook Checkpoint / Khóa nick
echo [*] Tự động khởi động lại nếu có lỗi hoặc mất kết nối tạm thời.
echo ================================================================================
echo.

:loop
echo [%time%] Bắt đầu chạy Bot...
node index.js
echo.
echo [%time%] Bot đã dừng hoặc gặp sự cố! Tự động khởi động lại sau 5 giây...
echo Nhấn phím Ctrl + C nếu muốn tắt hẳn Bot.
timeout /t 5 > nul
goto loop
