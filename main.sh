#!/bin/bash
# Export library paths for native modules like node-canvas
export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/nix/var/nix/profiles/default/lib"
for p in /nix/store/*-cairo-*/lib /nix/store/*-pango-*/lib /nix/store/*-pixman-*/lib /nix/store/*-libpng-*/lib; do
  if [ -d "$p" ]; then
    export LD_LIBRARY_PATH="$p:$LD_LIBRARY_PATH"
  fi
done

npm start
