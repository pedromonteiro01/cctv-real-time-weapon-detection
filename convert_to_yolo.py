import os
import xml.etree.ElementTree as ET

def convert_to_yolo_format(input_dir, output_dir, class_list):
    """
    convert XML annotations to YOLO format.

    Parameters:
    - input_dir: Directory containing XML annotations.
    - output_dir: Directory to save YOLO formatted annotations.
    - class_list: List of classes in the dataset.
    """

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.endswith('.xml'):
            tree = ET.parse(os.path.join(input_dir, filename))
            root = tree.getroot()

            with open(os.path.join(output_dir, filename.replace('.xml', '.txt')), 'w') as out_file:
                for obj in root.findall('object'):
                    class_name = obj.find('name').text
                    if class_name not in class_list:
                        continue
                    class_id = class_list.index(class_name)

                    bndbox = obj.find('bndbox')
                    xmin = int(bndbox.find('xmin').text)
                    ymin = int(bndbox.find('ymin').text)
                    xmax = int(bndbox.find('xmax').text)
                    ymax = int(bndbox.find('ymax').text)

                    width = int(root.find('size').find('width').text)
                    height = int(root.find('size').find('height').text)

                    x_center = (xmin + xmax) / 2.0 / width
                    y_center = (ymin + ymax) / 2.0 / height
                    w = (xmax - xmin) / width
                    h = (ymax - ymin) / height

                    out_file.write(f"{class_id} {x_center} {y_center} {w} {h}\n")

if __name__ == "__main__":
    INPUT_DIR = 'OD-WeaponDetection/Knife_detection/annotations'
    OUTPUT_DIR = 'knife-dataset/labels'
    CLASS_LIST = ['knife']

    convert_to_yolo_format(INPUT_DIR, OUTPUT_DIR, CLASS_LIST)
