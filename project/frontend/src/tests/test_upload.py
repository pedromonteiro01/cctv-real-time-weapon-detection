from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

def test_video_upload():
    options = webdriver.FirefoxOptions()
    driver = webdriver.Firefox(options=options)
    wait = WebDriverWait(driver, 10)

    try:
        # Login
        driver.get('http://localhost:3000/login')
        driver.find_element(By.NAME, "username").send_keys("pmapm@ua.pt")
        driver.find_element(By.NAME, "password").send_keys("password")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(2)

        if driver.current_url == 'http://localhost:3000/personal':
            print("Login successful")
        else:
            print("Login failed")
            return

        driver.get('http://localhost:3000/upload')

        file_path = os.path.abspath('sample.mp4')
        file_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
        file_input.send_keys(file_path)
        upload_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button")))
        upload_button.click()
        print("Submitted file...")

        time.sleep(2)

        driver.get('http://localhost:3000/upload')

        time.sleep(2) 

        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".upload-video-table"))
        )
        
        videos = driver.find_elements(By.CSS_SELECTOR, ".upload-video-table tbody tr")
        video_found = any('sample' in video.text for video in videos)
        if video_found:
            print("Video containing 'sample' is successfully listed in the table.")
        else:
            print("Video containing 'sample' is not listed in the table.")

    finally:
        driver.quit()

if __name__ == "__main__":
    test_video_upload()
