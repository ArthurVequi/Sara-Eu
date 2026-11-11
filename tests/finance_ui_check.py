# -*- coding: utf-8 -*-
from pathlib import Path
from tempfile import gettempdir
from playwright.sync_api import sync_playwright

output = Path(gettempdir()) / 'organiza-finance-mobile.png'

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5174', wait_until='networkidle')
    page.locator('.app-nav button').nth(3).click()
    page.wait_for_timeout(250)
    page.locator('.finance-toggle').click()
    groups = page.locator('.finance-action-groups button')
    assert groups.count() == 2
    groups.nth(0).click()
    types = page.locator('.finance-action-types button')
    assert types.count() == 2
    page.screenshot(path=str(output), full_page=True)
    types.nth(0).click()
    assert page.get_by_label('Editar item').is_visible()
    browser.close()
