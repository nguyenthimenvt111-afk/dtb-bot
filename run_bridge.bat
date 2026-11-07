@echo off
chcp 65001 > nul
title DTB BOT - PC RESIDENTIAL PROXY BRIDGE

echo ================================================================================
echo             DTB BOT - CẦU NỐI CHIA SẺ IP MÁY DÂN CƯ CHO BOT TRÊN VPS
echo ================================================================================
echo [*] Script này mở Proxy Server trên máy tính của bạn.
echo [*] Giúp Bot treo trên VPS/Replit mượn được IP máy này để tránh Checkpoint FB.
echo ================================================================================
echo.

node scripts/pc_proxy_bridge.js
pause
