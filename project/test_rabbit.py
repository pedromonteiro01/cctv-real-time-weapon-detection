import pika

def test_rabbitmq_connection():
    rabbitmq_server = 'localhost'
    rabbitmq_username = 'user'
    rabbitmq_password = 'password'

    credentials = pika.PlainCredentials(rabbitmq_username, rabbitmq_password)
    connection_parameters = pika.ConnectionParameters(
        host=rabbitmq_server,
        port=5673,  # Use the correct port
        credentials=credentials
    )

    try:
        connection = pika.BlockingConnection(connection_parameters)
        print("Connected to RabbitMQ successfully!")
        connection.close()
    except pika.exceptions.ProbableAuthenticationError as e:
        print(f"Authentication error: {e}")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == '__main__':
    test_rabbitmq_connection()
