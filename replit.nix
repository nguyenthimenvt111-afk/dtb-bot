{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.cairo
    pkgs.pango
    pkgs.libjpeg
    pkgs.giflib
    pkgs.librsvg
    pkgs.pixman
    pkgs.pkg-config
  ];
}
