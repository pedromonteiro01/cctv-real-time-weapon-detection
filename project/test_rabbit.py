import pika

# Adjust these parameters to match your RabbitMQ setup
credentials = pika.PlainCredentials('user', 'password')
parameters = pika.ConnectionParameters('localhost', 5672, '/', credentials)

try:
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    print("Connection to RabbitMQ established successfully")
    connection.close()
except Exception as e:
    print(f"Failed to connect to RabbitMQ: {str(e)}")
