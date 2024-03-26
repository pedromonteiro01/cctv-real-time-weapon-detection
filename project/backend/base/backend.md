## API Endpoints Documentation

### REST API Endpoints

#### Authentication

- **Login Endpoint**
  - **URL:** `/login/`
  - **Method:** `POST`
  - **Description:** Authenticate users and establish a session.
  - **Payload Example:**
    ```json
    {
      "username": "user",
      "password": "pass"
    }
    ```

### WebSocket Endpoints

#### Video Streaming

- **Single Camera Stream**
  - **Endpoint:** `ws/video/{camera_id}/`
  - **Description:** Connects to a single camera's live video stream.
  - **Parameters:**
    - `camera_id` (string) - The identifier of the camera.

- **Multi-Camera Stream**
  - **Endpoint:** `ws/multi_camera/{token}/`
  - **Description:** Streams video from multiple cameras authorized by a specific token.
  - **Parameters:**
    - `token` (string) - Authorization token for accessing multiple cameras.

### Static Files

Django also serves static media files, configured through `settings.MEDIA_URL`, providing access to uploaded media like images and videos.
