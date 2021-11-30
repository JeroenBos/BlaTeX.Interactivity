#/bin/bash

# alternatively I could set up a submodule...
mkdir -p tools
unameOut="$(uname -s)"

# download chrome version of layout engine:
case "${unameOut}" in
    MINGW*)     curl -L -o tools/google-chrome-standalone.exe https://github.com/JeroenBos/JBSnorro.LayoutEngine/raw/master/LayoutEngine/installers/ChromeStandaloneSetup64.exe;           ;;
    *)          curl -L -o tools/google-chrome-stable.deb    https://github.com/JeroenBos/JBSnorro.LayoutEngine/raw/master/LayoutEngine/installers/google-chrome-stable_current_amd64.deb; ;;
esac

# download layout engine:
case "${unameOut}" in
    MINGW*)     curl -L -o tools/LayoutEngine.exe https://github.com/JeroenBos/JBSnorro.LayoutEngine/raw/master/LayoutEngine/publish/LayoutEngine.exe;
                rm tools/chromedriver.exe -f;
                tools/LayoutEngine.exe --version;
                ;;
    *)          curl -L -o tools/layoutengine https://github.com/JeroenBos/JBSnorro.LayoutEngine/raw/master/LayoutEngine/publish/LayoutEngine;
                sudo chmod 755 './tools/layoutengine';
                rm -f tools/chromedriver;
                tools/layoutengine --version;
                ;;
esac


