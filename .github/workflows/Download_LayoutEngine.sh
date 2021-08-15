#/bin/bash

# alternatively I could set up a submodule...
mkdir -p tools
unameOut="$(uname -s)"
case "${unameOut}" in
    MINGW*)     curl -L -o tools/LayoutEngine.exe https://github.com/JeroenBos/JBSnorro.LayoutEngine/raw/master/LayoutEngine/publish/LayoutEngine.exe ;;
    *)          curl -L -o tools/layoutengine https://github.com/JeroenBos/JBSnorro.LayoutEngine/raw/master/LayoutEngine/publish/LayoutEngine         ;;
esac
cd tools
ls
