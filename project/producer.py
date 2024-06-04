import cv2
import base64
import aio_pika
import pika
import json
import time
import threading
import asyncio

def encode_frame(frame, width=640, height=360):
    """Encodes a frame to a base64-encoded JPEG."""
    if frame is None:
        return None
    frame = cv2.resize(frame, (width, height))
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

async def send_frame_to_queue_async(channel, exchange_name, routing_key, frame_base64, camera_id, user_id):
    if frame_base64 is None:
        return
    message_payload = {
        'camera_id': camera_id,
        'user_id': user_id,
        'frame': frame_base64,
        'timestamp': int(time.time() * 1000),
    }
    await channel.default_exchange.publish(
        aio_pika.Message(body=json.dumps(message_payload).encode()),
        routing_key=routing_key
    )
    print(f"Published frame from Camera {camera_id} to exchange {exchange_name} asynchronously")

def send_end_of_stream_message(channel, exchange_name, routing_key, camera_id):
    """Sends an end-of-stream message to notify that all frames have been processed."""
    message_payload = {
        'camera_id': camera_id,
        'end_of_stream': True
    }
    channel.basic_publish(exchange=exchange_name,
                          routing_key=routing_key,
                          body=json.dumps(message_payload))
    print(f"Sent end-of-stream message for Camera {camera_id}")

async def process_video(camera_id, video_path, connection_parameters, user_id, fps):
    """Processes video: capturing frames, encoding, and sending them asynchronously via RabbitMQ."""
    try:
        connection = await aio_pika.connect_robust(**connection_parameters)
        channel = await connection.channel()

        exchange_name = 'camera_exchange'
        routing_key = f"camera_stream_{camera_id}"
        await channel.declare_exchange(exchange_name, aio_pika.ExchangeType.DIRECT)
        queue_name = f"camera_stream_queue_{camera_id}"
        queue = await channel.declare_queue(queue_name, durable=True)
        await queue.bind(exchange_name, routing_key)

        cap = cv2.VideoCapture(video_path)
        delay = 1 / fps
        drift = 0.0

        while cap.isOpened():
            start_time = time.time()
            ret, frame = cap.read()
            if not ret:
                break

            frame_base64 = encode_frame(frame)
            await send_frame_to_queue_async(channel, exchange_name, routing_key, frame_base64, camera_id, user_id)

            process_time = time.time() - start_time
            intended_wait = delay - process_time + drift
            actual_wait = max(0, intended_wait)
            await asyncio.sleep(actual_wait)

            drift = intended_wait - actual_wait

    except Exception as e:
        print(f"Error processing video for camera {camera_id}: {e}")
    finally:
        cap.release()
        await send_end_of_stream_message(channel, exchange_name, routing_key, camera_id)
        await connection.close()
        print(f"Released video capture and closed connection for camera {camera_id}")


async def main():
    rabbitmq_server = 'localhost'
    rabbitmq_username = 'user'
    rabbitmq_password = 'password'
    camera_user_map = {'1': 1}
    camera_sources = {'1': ['./media/gun-video.mp4']}
    connection_parameters = {
        "host": rabbitmq_server,
        "port": 5673,
        "login": rabbitmq_username,
        "password": rabbitmq_password
    }

    fps_map = {}
    for camera_id, video_paths in camera_sources.items():
        for video_path in video_paths:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            fps_map[(camera_id, video_path)] = fps
            cap.release()
            print(f"- Video {video_path} -> FPS {fps}")

    tasks = []
    for (camera_id, video_paths), fps in zip(camera_sources.items(), fps_map.values()):
        user_id = camera_user_map[camera_id]
        for video_path in video_paths:
            task = asyncio.create_task(process_video(camera_id, video_path, connection_parameters, user_id, fps))
            tasks.append(task)

    await asyncio.gather(*tasks)
    print("Video processing complete for all cameras.")

if __name__ == '__main__':
    asyncio.run(main())
