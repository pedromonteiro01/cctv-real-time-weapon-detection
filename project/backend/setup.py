import os
import subprocess
import sys

def setup_virtual_env():
    """Sets up Python virtual environment and installs dependencies."""
    venv_path = os.path.join('venv', 'bin')
    python_executable = os.path.join(venv_path, 'python3')
    pip_executable = os.path.join(venv_path, 'pip')

    # Ensure the virtual environment is created if it does not exist
    if not os.path.exists(venv_path):
        print("Creating virtual environment...")
        subprocess.run(['python3', '-m', 'venv', 'venv'], check=True)

    # Install dependencies
    print("Installing dependencies...")
    subprocess.run([pip_executable, 'install', '--upgrade', 'pip'], check=True)
    subprocess.run([pip_executable, 'install', '-r', 'requirements.txt'], check=True)

def run_backend_commands(port):
    """Runs Django management commands and starts the Uvicorn server on a specified port with WhiteNoise."""
    venv_path = os.path.join('venv', 'bin')
    python_executable = os.path.join(venv_path, 'python3')

    # Django management commands
    print("Running Django management commands...")
    subprocess.run([python_executable, 'manage.py', 'collectstatic', '--noinput'], check=True)
    subprocess.run([python_executable, 'manage.py', 'custom_migrate'], check=True)
    subprocess.run([python_executable, 'manage.py', 'populate_db'], check=True)  # Assuming you have a custom command

    # Start Uvicorn with static file handling via WhiteNoise on specified port
    print(f"Starting the Uvicorn server on port {port}...")
    subprocess.run([python_executable, '-m', 'uvicorn', 'backend.asgi:application', '--host', '0.0.0.0', '--port', str(port), '--reload'], check=True)

def main():
    if len(sys.argv) < 2:
        print("Usage: python setup.py [port]")
        sys.exit(1)

    port = sys.argv[1]
    setup_virtual_env()
    if os.path.exists(os.path.join('venv', 'bin', 'pip')):
        run_backend_commands(port)
    else:
        print("Failed to set up virtual environment properly. Please check the logs and try again.")

if __name__ == "__main__":
    main()
