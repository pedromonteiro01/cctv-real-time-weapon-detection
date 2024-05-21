import cv2
import base64
import pika
import json
import time
import threading

def encode_frame(frame, width=640, height=360):
    frame = cv2.resize(frame, (width, height))
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

def send_frame_to_queue(channel, queue_name, frame_base64, camera_id, user_id, analyze=False):
    message_payload = {
        'camera_id': camera_id,
        'user_id': user_id,
        'frame': frame_base64,
        'timestamp': int(time.time() * 1000),
        'analyze': analyze,
    }
    channel.basic_publish(exchange='',
                          routing_key=queue_name,
                          body=json.dumps(message_payload))
    print(f"Published frame from Camera {camera_id} to queue {queue_name}, analyze: {analyze}")

def process_video(camera_id, video_path, connection_parameters, user_id, frame_rate=10):
    connection = pika.BlockingConnection(connection_parameters)
    channel = connection.channel()
    queue_name = f"camera_stream_{camera_id}"
    channel.queue_declare(queue=queue_name, durable=True)

    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))  # get the FPS of the video
    delay = 1 / frame_rate  # set delay based on target frame rate

    analyze_interval = 1  # seconds
    last_analyze_time = time.time()

    try:
        while cap.isOpened():
            start_time = time.time()
            ret, frame = cap.read()
            if not ret:
                break

            current_time = time.time()
            analyze = (current_time - last_analyze_time) >= analyze_interval

            if analyze:
                last_analyze_time = current_time

            frame_base64 = encode_frame(frame)
            send_frame_to_queue(channel, queue_name, frame_base64, camera_id, user_id, analyze)

            # compute remaining time to wait to maintain the desired frame rate
            process_time = time.time() - start_time
            wait_time = max(0, delay - process_time)
            time.sleep(wait_time)
    finally:
        cap.release()
        connection.close()
        print(f"Released video capture and closed connection for camera {camera_id}")

def main():
    rabbitmq_server = 'localhost'
    rabbitmq_username = 'user'
    rabbitmq_password = 'password'
    camera_user_map = {
        '1': 1,
        '2': 1,
        '3': 2,
    }
    camera_sources = {
        '1': ['./media/sample.mp4'],
        '2': ['./media/sample.mp4'],
        '3': ['./media/sample.mp4'],
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
            thread = threading.Thread(target=process_video, args=(camera_id, video_path, connection_parameters, user_id, 10))
            thread.start()
            threads.append(thread)

    for thread in threads:
        thread.join()

    print("Video processing complete for all cameras.")

if __name__ == '__main__':
    main()
