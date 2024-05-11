from selenium import webdriver
import time, os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.options import Options

options = webdriver.FirefoxOptions()

driver = webdriver.Firefox(options=options)
wait = WebDriverWait(driver, 10)

base_url = "http://localhost:3000"

try:
    driver.get('http://localhost:3000/login') 

    driver.find_element(By.NAME, "username").send_keys("pmapm@ua.pt")
    driver.find_element(By.NAME, "password").send_keys("password")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    time.sleep(3)

    driver.get('http://localhost:3000/upload') 

    file_path = os.path.abspath('video.mp4')
    file_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
    file_input.send_keys(file_path)
    upload_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button")))
    upload_button.click()
    print("Submitted file...")

    WebDriverWait(driver, 180).until(EC.presence_of_element_located((By.CLASS_NAME, "download-link")))

    download_link = driver.find_element(By.CLASS_NAME, "download-link")
    download_link.click()

    time.sleep(2)

    print("download file with success...")

finally:
    driver.quit()
