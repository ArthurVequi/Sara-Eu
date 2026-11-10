"""Smoke test da splash. Execute com a versão compilada servida na porta 4173."""

from playwright.sync_api import expect, sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    for width, height, reduced in [(320, 568, False), (390, 844, False), (768, 1024, False), (1366, 768, False), (1920, 1080, True)]:
        page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce" if reduced else "no-preference")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:4173", wait_until="domcontentloaded")
        splash = page.locator(".splash-screen")
        expect(splash).to_be_attached()
        splash.evaluate("""(overlay, reduced) => {
          const animations = overlay.getAnimations({subtree: true});
          const icon = overlay.querySelector('img');
          const name = overlay.querySelector('.splash-name');
          const brand = overlay.querySelector('.splash-brand');
          const check = (ok, message) => { if (!ok) throw new Error(message) };
          const opacity = node => Number(getComputedStyle(node).opacity);
          const frame = ms => animations.forEach(animation => { animation.pause(); animation.currentTime = ms; });
          check(animations.length >= 3, 'Missing animations');
          check(animations.every(animation => animation.effect.getTiming().duration === 1500), 'Unexpected duration');
          frame(0);
          check(opacity(icon) === 0 && opacity(name) === 0 && opacity(overlay) === 1, 'First frame');
          frame(500);
          const rect = icon.getBoundingClientRect();
          check(opacity(icon) === 1 && opacity(name) === 0, 'Icon phase');
          if (!reduced) check(Math.abs(rect.left + rect.width / 2 - innerWidth / 2) < 1, 'Initial icon centering');
          frame(700);
          check(opacity(name) > 0 && opacity(name) < 1, 'Name fade-in');
          if (reduced) check(getComputedStyle(name).transform === 'none', 'Reduced motion translated');
          frame(1100);
          const bounds = brand.getBoundingClientRect();
          check(opacity(icon) === 1 && opacity(name) === 1, 'Brand settled');
          check(Math.abs(bounds.left + bounds.width / 2 - innerWidth / 2) < 1 && bounds.left >= 0, 'Final centering');
          check(document.documentElement.scrollWidth === innerWidth, 'Horizontal overflow');
          frame(1350);
          check(opacity(overlay) === 1, 'Fade started too early');
          frame(1425);
          check(Math.abs(opacity(overlay) - .5) < .01, 'Fade timing');
          animations.forEach(animation => animation.play());
        }""", reduced)
        expect(splash).to_have_count(0)
        expect(page.get_by_role("heading", name="Hoje")).to_be_visible()
        page.get_by_role("navigation").get_by_role("button", name="Semana").click()
        expect(page.get_by_role("heading", name="Minha semana")).to_be_visible()
        expect(splash).to_have_count(0)
        page.reload(wait_until="domcontentloaded")
        expect(splash).to_be_attached()
        expect(splash).to_have_count(0)
        expect(page.get_by_role("heading", name="Hoje")).to_be_visible()
        assert not errors, errors
        print(f"{width}x{height}, reduced={reduced}: OK")
        page.close()
    browser.close()
