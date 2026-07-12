const puppeteer = require("puppeteer");

const html = `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --background: #fcfcfc;
    --foreground: #1c1917;
    --brand: #d97706;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: "Inter", sans-serif;
    background-color: var(--background);
    color: var(--foreground);
    width: 1200px;
    height: 630px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: 
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 230, 211, 0.8) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 100% 30%, rgba(245, 220, 220, 0.6) 0%, transparent 70%),
      radial-gradient(ellipse 60% 50% at 0% 40%, rgba(240, 240, 230, 0.7) 0%, transparent 70%),
      var(--background);
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 40px;
  }
  .logo svg {
    width: 48px;
    height: 48px;
    color: var(--brand);
  }
  .logo span {
    font-family: "Plus Jakarta Sans", sans-serif;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(0,0,0,0.1);
    background: rgba(255,255,255,0.7);
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 16px;
    font-weight: 500;
    color: #57534e;
    margin-bottom: 32px;
  }
  .badge .dot {
    width: 8px;
    height: 8px;
    background-color: var(--brand);
    border-radius: 50%;
  }
  h1 {
    font-family: "Plus Jakarta Sans", sans-serif;
    font-size: 64px;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 0;
    max-width: 900px;
  }
  h1 span {
    display: block;
    color: rgba(28, 25, 23, 0.9);
  }
  p {
    font-size: 24px;
    color: #57534e;
    max-width: 800px;
    line-height: 1.5;
    margin-top: 32px;
  }
</style>
</head>
<body>
  <div class="logo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
    <span>Abroad Compass</span>
  </div>
  
  <div class="badge">
    <div class="dot"></div>
    Built for students heading to Germany
  </div>

  <h1>
    Your Journey to Germany Starts Here.
    <span>Master the Complete Study Abroad Operating System.</span>
  </h1>

  <p>
    Seamlessly navigate university applications, German language learning, budget planning,
    and visa procedures, all in one place. Built for ambitious students like you.
  </p>
</body>
</html>
`;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.screenshot({ path: "public/og-image.png" });
  await browser.close();
  console.log("OG Image generated!");
})();
