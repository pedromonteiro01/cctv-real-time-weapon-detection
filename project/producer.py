import cv2
import base64
import pika
import json
import time
import threading

def encode_frame(frame):
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

def send_frame_to_queue(channel, queue_name, frame_base64, camera_id, user_id):
    message_payload = {
        'camera_id': camera_id,
        'user_id': user_id,
        'frame': frame_base64,
        'timestamp': int(time.time() * 1000),
    }
    channel.basic_publish(exchange='',
                          routing_key=queue_name,
                          body=json.dumps(message_payload))
    print(f"Published frame from Camera {camera_id} to queue {queue_name}")


def process_video(camera_id, video_path, connection_parameters, user_id):
    connection = pika.BlockingConnection(connection_parameters)
    channel = connection.channel()
    queue_name = f"camera_stream_{camera_id}"
    channel.queue_declare(queue=queue_name, durable=True)

    cap = cv2.VideoCapture(video_path)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_base64 = encode_frame(frame)
        send_frame_to_queue(channel, queue_name, frame_base64, camera_id, user_id) 
        time.sleep(0.1) 
    cap.release()
    connection.close()

def main():
    rabbitmq_server = 'localhost'
    rabbitmq_username = 'user'
    rabbitmq_password = 'password'
    camera_user_map = {
        '1': 1,  # Camera ID 1 belongs to User ID 1
        '2': 1,  # Camera ID 2 belongs to User ID 1
        '3': 2,  # Camera ID 3 belongs to User ID 2
    }
    camera_sources = {
        '1': ['./media/guns.mp4'],  # Camera ID 1 video
        '2': ['./media/guns4.mp4'],  # Camera ID 2 video
        '3': ['./media/guns.mp4'],  # Camera ID 3 video
    }

    credentials = pika.PlainCredentials(rabbitmq_username, rabbitmq_password)
    connection_parameters = pika.ConnectionParameters(
        host=rabbitmq_server,
        credentials=credentials
    )

    threads = []
    for camera_id, video_paths in camera_sources.items():
        user_id = camera_user_map[camera_id] 
        for video_path in video_paths:
            thread = threading.Thread(target=process_video, args=(camera_id, video_path, connection_parameters, user_id))
            thread.start()
            threads.append(thread)

    for thread in threads:
        thread.join()

    print("Video processing complete for all cameras.")


if __name__ == '__main__':
    main()
