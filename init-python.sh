#!/bin/bash

# Path to your venv
VENV_DIR=".venv"

# Check if the virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
else
    echo "Virtual environment already exists."
fi

# Activate the virtual environment
echo "🔌 Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Check for requirements.txt
if [ -f "requirements.txt" ]; then
    echo "Installing dependencies from requirements.txt..."
    pip install --upgrade pip > /dev/null
    pip install -r requirements.txt
else
    echo "No requirements.txt found. Skipping dependency install."
fi

echo "All done. You're now in the virtual environment!"
echo "To deactivate, run: deactivate"