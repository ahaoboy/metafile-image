import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';

export async function metafileImage(metafilePath: string, imagePath: string, width = 3840, height = 2160, quality = 100): Promise<boolean> {
  const metafileContent = readFileSync(metafilePath, 'utf8');
  const browser = await puppeteer.launch({ headless: true });
   try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    const url = `https://esbuild.github.io/analyze`
    await page.goto(url, { waitUntil: 'networkidle2' });
    const paste = await page.evaluate((text) => {
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
        bubbles: true,
        cancelable: true,
      });
      if (!pasteEvent.clipboardData) {
        return false
      }
      pasteEvent.clipboardData.setData('text/plain', text);
      document.body.dispatchEvent(pasteEvent);
      return true
    }, metafileContent);
    await page.waitForNetworkIdle();
    await page.waitForSelector('canvas', { timeout: 10000 })
    const chart = await page.$("canvas")
    if (!chart) {
      return false
    }
    await page.evaluate(() => {
      return new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(resolve);
        });
      });
    });
    const supportQuality = !['.png'].some(i => imagePath.toLowerCase().endsWith(i))
    await chart.screenshot({ quality: supportQuality ? quality : undefined, path: imagePath, fullPage: false, });
    await browser.close();
    return true
  } catch (e) {
    await browser.close();
    console.log(e)
    return false
  }
}
