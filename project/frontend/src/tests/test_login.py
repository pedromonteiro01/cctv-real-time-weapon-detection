from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
import time

def test_login():
    options = webdriver.FirefoxOptions()
    # options.add_argument("--headless")

    driver = webdriver.Firefox(options=options)
    
    try:
        driver.get('http://localhost:3000/login') 

        driver.find_element(By.NAME, "username").send_keys("pmapm@ua.pt")
        driver.find_element(By.NAME, "password").send_keys("password")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        time.sleep(5)

        if driver.current_url == 'http://localhost:3000/personal':
            print("Login successful")
        else:
            print("Login failed")

    finally:
        driver.quit()

if __name__ == "__main__":
    test_login()
