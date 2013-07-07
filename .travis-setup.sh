#! /bin/sh

# Make sure /dev/shm has correct permissions.
ls -l /dev/shm
sudo chmod 1777 /dev/shm
ls -l /dev/shm


case $BROWSER in
Chrome*)
    export VERSION=$(echo $BROWSER | sed -e's/[^-]*-//')
    export BROWSER=$(echo $BROWSER | sed -e's/-.*//')
    echo "Getting $VERSION of $BROWSER"
    export CHROME=google-chrome-${VERSION}_current_amd64.deb
    wget https://dl.google.com/linux/direct/$CHROME
    sudo dpkg --install $CHROME || sudo apt-get -f install
    ls -l /usr/bin/google-chrome
    google-chrome --version
    export CHROME_BIN="/usr/bin/google-chrome --no-sandbox"
    ;;

Firefox)
    firefox --version
    ;;
esac

