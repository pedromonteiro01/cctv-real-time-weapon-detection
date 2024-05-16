from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time, os

options = webdriver.FirefoxOptions()
driver = webdriver.Firefox(options=options)
wait = WebDriverWait(driver, 10)

try:
    driver.get('http://localhost:3000/login')
    driver.find_element(By.NAME, "username").send_keys("pmapm@ua.pt")
    driver.find_element(By.NAME, "password").send_keys("password")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    time.sleep(3)

    driver.get('http://localhost:3000/cameras')

    time.sleep(3)

    WebDriverWait(driver, 40).until(
        EC.presence_of_element_located((By.CLASS_NAME, "database-images-grid"))
    )
    cameras = driver.find_elements(By.CLASS_NAME, "database-image")

    if cameras:
        print("Test Passed: Cameras are displayed.")
    else:
        print("Test Failed: No cameras are displayed.")

finally:
    driver.quit()
