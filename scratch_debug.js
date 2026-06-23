const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', exception => {
    console.log(`Uncaught exception: "${exception}"`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error')
      console.log(`PAGE ERROR: "${msg.text()}"`);
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const errorOverlayText = await page.evaluate(() => {
    const errorContainer = document.querySelector('.bg-error\\/10');
    if (errorContainer) {
      return "FOUND CUSTOM ERROR BOUNDARY: " + errorContainer.innerText;
    }
    
    if (document.body.innerText.includes("Something went sideways.")) {
      return "Next.js Custom Error Boundary Rendered (no error details): " + document.body.innerText;
    }
    
    // Check if nextjs overlay is active with an error
    const nextjsPortal = document.querySelector('nextjs-portal');
    if (nextjsPortal && nextjsPortal.shadowRoot && nextjsPortal.shadowRoot.querySelector('#nextjs-toast-errors-root')) {
      return "NEXTJS NATIVE OVERLAY: " + nextjsPortal.shadowRoot.querySelector('#nextjs-toast-errors-root').innerText;
    }

    return null;
  });
  
  if (errorOverlayText) {
    console.log('ERROR OVERLAY DETECTED:', errorOverlayText.substring(0, 3000));
  } else {
    console.log('NO ERROR OVERLAY. Body:', await page.evaluate(() => document.body.innerText.substring(0, 500)));
  }

  await browser.close();
})();
