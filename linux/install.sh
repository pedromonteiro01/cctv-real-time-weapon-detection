#!/bin/bash

# define the Python modules and versions
modules=(
    "requests==2.28.0"
    "tqdm==4.64.0"
    "pytest==7.1.1"
    "torch>=1.8.0"
    "matplotlib==3.8.2"
    "pyyaml==5.3.1"
    "opencv-python>=4.1.1"
)

install_module() {
    module=$1
    echo "Installing $module..."
    pip3 install $module
}

# iterate over the modules and install each one
for module in "${modules[@]}"
do
    install_module $module
done

echo "All modules installed successfully."
