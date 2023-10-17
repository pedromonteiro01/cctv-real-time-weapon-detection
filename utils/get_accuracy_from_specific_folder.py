import subprocess
import os
import matplotlib.pyplot as plt

def evaluate_model(weight_file):
    # Run the val.py script using the provided weight file
    command = f"python3 yolov5/val.py --weights {weight_file} --data dataset.yaml --img 640 --conf 0.25 --iou 0.5"
    result = subprocess.run(command, shell=True, text=True, capture_output=True)
    
    return result.stderr

def extract_accuracy(output):
    # extract the mAP50 metric for the 'all' class from the output (both pistol and knife)
    for line in output.split("\n"):
        if "all" in line:
            metrics = line.split()
            print("metrics: ", metrics)
            return float(metrics[5])  # mAP50 is in the 6th column
    return 0.0

def find_best_weight(directory):
    best_weight = None
    best_accuracy = 0.0

    for filename in os.listdir(directory): # iterate through each file in the directory
        if filename.endswith(".pt"):  # check for weight files
            weight_path = os.path.join(directory, filename)
            print(f"Evaluating: {weight_path}")
            
            output = evaluate_model(weight_path)
            accuracy = extract_accuracy(output)
            
            if accuracy > best_accuracy:
                best_accuracy = accuracy
                best_weight = weight_path

    return best_weight, best_accuracy

def plot_results(weights_files, accuracies):
    plt.figure(figsize=(10,6))
    plt.bar(range(len(weights_files)), accuracies, align='center')
    plt.xticks(range(len(weights_files)), weights_files, rotation='vertical')
    plt.ylabel('mAP50')
    plt.xlabel('Weights File')
    plt.title('mAP50 for different weights files')
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    weights_directory = "weights-file"
    
    weights_files = []
    accuracies = []

    for filename in os.listdir(weights_directory):
        if filename.endswith(".pt"):
            weight_path = os.path.join(weights_directory, filename)
            print(f"Evaluating: {weight_path}")
            
            output = evaluate_model(weight_path)
            accuracy = extract_accuracy(output)
            
            weights_files.append(filename)
            accuracies.append(accuracy)
            
    best_index = accuracies.index(max(accuracies))
    print(f"Best weight file: {weights_files[best_index]} with mAP50: {accuracies[best_index]}")
    
    plot_results(weights_files, accuracies)

