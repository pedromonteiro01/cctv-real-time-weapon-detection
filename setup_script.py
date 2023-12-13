import os
import requests
from zipfile import ZipFile
from io import BytesIO

def download_and_extract_zip(repo_name):
    repo_url = f"https://github.com/{repo_name}/archive/refs/heads/main.zip"
    response = requests.get(repo_url, stream=True)
    if response.status_code == 200:
        with BytesIO() as file_bytes:
            for data in response.iter_content(1024):
                file_bytes.write(data)
            file_bytes.seek(0)
            with ZipFile(file_bytes) as zip_file:
                zip_file.extractall()
        print(f"Repository '{repo_name}' downloaded and extracted successfully.")
    else:
        print(f"Failed to download the repository '{repo_name}'. Status code: {response.status_code}")

def setup_environment(repo_name):
    repo_folder = f"{repo_name.split('/')[-1]}-main"
    if not os.path.isdir(repo_folder):
        download_and_extract_zip(repo_name)
    os.chdir(repo_folder)
    os.system("pip install -r requirements.txt")

if __name__ == "__main__":
    REPOSITORY_NAME = "pedromonteiro01/yolo-utils"
    setup_environment(REPOSITORY_NAME)
