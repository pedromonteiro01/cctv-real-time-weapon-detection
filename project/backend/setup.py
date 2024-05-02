import os
import subprocess

def setup_virtual_env():
    """Sets up Python virtual environment and installs dependencies."""
    venv_path = os.path.join('venv', 'bin')
    python_executable = os.path.join(venv_path, 'python3')
    pip_executable = os.path.join(venv_path, 'pip')

    # Ensure the virtual environment is created if it does not exist
    if not os.path.exists(venv_path):
        print("Creating virtual environment...")
        subprocess.run(['python3', '-m', 'venv', 'venv'], check=True)

    # Check if pip executable exists
    if not os.path.exists(pip_executable):
        print(f"Error: pip not found at {pip_executable}. Ensure virtual environment was created correctly.")
        return

    print("Installing dependencies...")
    subprocess.run([pip_executable, 'install', '--upgrade', 'pip'], check=True)
    subprocess.run([pip_executable, 'install', '-r', 'requirements.txt'], check=True)

def run_backend_commands():
    """Runs Django management commands and starts the Uvicorn server."""
    venv_path = os.path.join('venv', 'bin')
    python_executable = os.path.join(venv_path, 'python3')

    print("Running Django management commands...")
    subprocess.run([python_executable, 'manage.py', 'custom_migrate'], check=True)
    subprocess.run([python_executable, 'manage.py', 'populate_db'], check=True)

    print("Starting the Uvicorn server...")
    subprocess.run([python_executable, '-m', 'uvicorn', 'backend.asgi:application', '--host', '0.0.0.0', '--reload'], check=True)

def main():
    setup_virtual_env()
    if os.path.exists(os.path.join('venv', 'bin', 'pip')):
        run_backend_commands()
    else:
        print("Failed to set up virtual environment properly. Please check the logs and try again.")

if __name__ == "__main__":
    main()
