# Author: Pedro Monteiro
# Date: November 2023
# Computer Science Engineering MSc
# Aveiro University

import os
import requests
import shutil
from zipfile import ZipFile
from io import BytesIO
from tqdm import tqdm
import importlib.util
import pytest
import importlib.util
from pathlib import Path
import time
import logging

logging.basicConfig(filename='logs.log', level=logging.INFO, 
                    format='%(asctime)s:%(levelname)s:%(message)s')

# check if Git is installed
if shutil.which("git") is None:
    print("Git is not found on your system.")
    print("Please install Git manually from https://git-scm.com/download/win")
    exit()

# check if Python is installed
if shutil.which("python") is None and shutil.which("python3") is None:
    print("Python is not found on your system.")
    print("Please install Python manually from https://www.python.org/downloads/windows/")
    exit()

REPOSITORY = "pedromonteiro01/yolo-utils" # repository name

def download_and_extract_zip(repo_name):
    # define GitHub URL for the repository's ZIP file
    repo_url = f"https://github.com/{repo_name}/archive/refs/heads/main.zip"

    # GET request to download the repository as a ZIP file
    with requests.get(repo_url, stream=True) as response:
        if response.status_code == 200: # check if status code is OK
            total_size = int(response.headers.get('content-length', 0))
            block_size = 1024
            progress_bar = tqdm(total=total_size, unit='iB', unit_scale=True) # show progress bar on terminal
            with BytesIO() as file_bytes:
                for data in response.iter_content(block_size):
                    progress_bar.update(len(data))
                    file_bytes.write(data)
                progress_bar.close()

                if total_size != 0 and progress_bar.n != total_size:
                    print("ERROR, something went wrong")

                file_bytes.seek(0) # move the cursor to the beginning of the BytesIO buffer

                with ZipFile(file_bytes) as zip_file: # extract ZIP content
                    zip_file.extractall()
                    print(f"Repository '{repo_name}' downloaded and extracted successfully.")
        else:
            print(f"Failed to download the repository '{repo_name}'. Status code: {response.status_code}")

def setup_environment(repo_name):
    repo_folder = f"{repo_name.split('/')[-1]}-main"
    
    if os.path.isdir(repo_folder): # check if the repository directory already exists
        print(f"Repository {repo_name} is already present. Skipping download.")
    else:
        print(f"Setting up environment by downloading {repo_name} repository...")
        download_and_extract_zip(repo_name)


# function to train YOLOv5 model
def train_yolov5(data_yaml, pretrained_weights, batch_size, epochs, img_size):
    start_time = time.time()
    print(f"Training YOLOv5 with batch size {batch_size} for {epochs} epochs...")
    cmd = f"python yolov5/train.py --img {img_size} --batch {batch_size} --epochs {epochs} --data {data_yaml} --weights {pretrained_weights}"
    print("Running command:", cmd)
    os.system(cmd)
    
    train_dir = os.path.join("yolov5", "runs", "train") # check if the 'runs/train' directory exists
    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"The directory {train_dir} does not exist. Training might have failed.")
    
    train_runs = os.listdir(train_dir) # check if the directory is not empty
    if not train_runs:
        raise FileNotFoundError(f"No training runs found in {train_dir}.")
    
    end_time = time.time()
    training_duration = end_time - start_time
    logging.info(f"Training completed: Batch Size {batch_size}, Epochs {epochs}, Img Size {img_size}, Duration {training_duration:.2f} seconds")

    return os.path.join(train_dir, sorted(train_runs)[-1], "weights", "best.pt")


def predict(data_yaml, weights, batch_size, epochs, detect_folder):
    start_time = time.time()
    print(f"Running predictions with batch size {batch_size}...")
    output_folder = os.path.join("yolov5/runs/detect", detect_folder)

    # run detect YOLOv5 command
    cmd = f"python yolov5/detect.py --source dataset/valid/images --weights {weights} --conf 0.25 --img-size 640 --save-txt --name {detect_folder}"
    os.system(cmd)

    end_time = time.time()
    training_duration = end_time - start_time
    logging.info(f"Prediction completed: Batch Size {batch_size}, Epochs {epochs}, Duration {training_duration:.2f} seconds")

    return output_folder

def run_tests(): # execute test for metrics extraction functions
    test_files = ['iou_test.py', 'accuracy_test.py']
    pytest.main(test_files)

if __name__ == "__main__":
    DATA_YAML = "dataset.yaml" # define yaml file path
    PRETRAINED_WEIGHTS = "yolov5s-model.pt" # define pre trained weights file path
    BATCH_SIZES = [6, 12] # batch sizes to test
    EPOCHS = [18] # epochs to test
    IMG_SIZES = [256, 640, 1280]
    DETECT_FOLDER = os.path.join("yolov5", "runs", "detect") # folder with images to detect
    VALID_FOLDER = os.path.join("dataset", "valid", "labels") # folder with real labels

    REPOSITORY_NAME = "pedromonteiro01/yolo-utils" # define repository name
    setup_environment(REPOSITORY_NAME) # get repository from github (dataset, yolov5, and metrics scripts)

    print(f"Changing working directory to the downloaded {REPOSITORY_NAME} repository...")
    os.chdir(os.getcwd() + "/yolo-utils-main/")

    print("Installing required packages from requirements.txt...")
    os.system("pip install -r requirements.txt --user") # install requirements needed to run this script

    print("Current working directory:", os.getcwd())

    run_tests() # run metrics pytests

    evaluation_details = []

    total_start_time = time.time()
    for batch_size in BATCH_SIZES:
        for epoch in EPOCHS:
            for img_size in IMG_SIZES:
                # train model
                print(f"Starting training for batch size {batch_size} and epoch {epoch}...")
                trained_weights = train_yolov5(DATA_YAML, PRETRAINED_WEIGHTS, batch_size, epoch, img_size)
                
                # predict and save results
                print(f"Starting prediction for batch size {batch_size} and epoch {epoch}...")
                detect_folder = f"batch{batch_size}_epoch{epoch}"
                output_folder = predict(DATA_YAML, trained_weights, batch_size, epoch, detect_folder)

                # import confusion matrix script using importlib to avoid importing errors
                conf_spec = importlib.util.spec_from_file_location("conf_matrix", "conf_matrix.py")
                conf_matrix = importlib.util.module_from_spec(conf_spec)
                conf_spec.loader.exec_module(conf_matrix)
                
                conf_matrix.generate_confusion_matrix(
                    Path(__file__).parent / 'yolo-utils-main/yolov5',  # directory where YOLOv5 is located
                    DATA_YAML,  # path to data.yaml file
                    trained_weights,  # weights from the trained model
                    batch_size,  # batch size used for training
                    640,  # image size used for training (e.g., 640)
                    0.5,  # confidence threshold for predictions
                    0.45,  # IoU threshold for predictions
                    task='val'  # task could be 'val', 'test', etc.
                )

                os.chdir("..") # exit yolov5 to run accuracy script
                
                # import accuracy script
                accuracy_spec = importlib.util.spec_from_file_location("accuracy", "accuracy.py")
                accuracy = importlib.util.module_from_spec(accuracy_spec)
                accuracy_spec.loader.exec_module(accuracy)

                output = accuracy.evaluate_model(trained_weights)
                mAP50 = accuracy.extract_metrics(output)

                evaluation_details.append((mAP50, epoch, batch_size))

    # find the best model after all trainings and evaluations
    best_weight, best_mAP50, best_epochs, best_batch_size, all_mAP50_values, all_epochs, all_batch_sizes = accuracy.find_best_config()
    
    # output best file in terms of accuracy
    print(f"Best weight file: {best_weight} with mAP50: {best_mAP50}")
    print(f"Number of Epochs: {best_epochs}, Batch Size: {best_batch_size}")

    # plot accuracy results of all evaluations
    accuracy.plot_results(all_mAP50_values, all_epochs, all_batch_sizes)

    # import IoU script from github
    iou2_spec = importlib.util.spec_from_file_location("iou2", "iou2.py")
    iou2 = importlib.util.module_from_spec(iou2_spec)
    iou2_spec.loader.exec_module(iou2)
    
    print(os.getcwd())
    iou2.main(DETECT_FOLDER, VALID_FOLDER) # call IoU function
            
    total_end_time = time.time()
    total_duration = total_end_time - total_start_time
    logging.info(f"Total training duration: {total_duration:.2f} seconds")

    print("All training and evaluations completed!")

    print("Cleaning up by removing the cloned repository...")
    os.chdir("..")
    #shutil.rmtree("yolo-utils-main")