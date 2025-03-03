import puppeteer, { Page } from "puppeteer"
import { readFileSync } from "fs"

export type Type = "treemap" | "sunburst" | "flame"
export type Options = {
  mode: string
  width: number
  height: number
  quality: number
  type: Type | (string & {})
}
const DefaultOptions: Options = {
  mode: "",
  width: 3840,
  height: 2160,
  quality: 100,
  type: "treemap",
}

async function waitIdle(page: Page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve)
      })
    })
  })
}

export async function metafileImage(
  metafilePath: string,
  imagePath: string,
  options: Partial<Options> = {},
): Promise<false | Uint8Array> {
  const {
    width,
    height,
    mode,
    quality,
    type,
  } = {
    ...DefaultOptions,
    ...options,
  }
  try {
    const metafileContent = readFileSync(metafilePath, "utf8")
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 100_000
    })
    const page = await browser.newPage()
    await page.setViewport({ width, height })
    const url = `https://esbuild.github.io/analyze`
    await page.goto(url, { waitUntil: "networkidle2" })

    if (mode) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: mode },
      ])
    }

    const paste = await page.evaluate((text) => {
      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData: new DataTransfer(),
        bubbles: true,
        cancelable: true,
      })
      if (!pasteEvent.clipboardData) {
        return false
      }
      pasteEvent.clipboardData.setData("text/plain", text)
      document.body.dispatchEvent(pasteEvent)
      return true
    }, metafileContent)

    if (!paste) {
      return false
    }

    await page.waitForNetworkIdle()
    await page.waitForSelector("canvas", { timeout: 10000 })

    waitIdle(page)
    const IdMap: Record<string, string> = {
      "treemap": "useTreemap",
      "sunburst": "useSunburst",
      "flame": "useFlame",
    }
    const id = IdMap[type] ?? "useTreemap"
    const dom = await page.$(`#${id}`)
    if (dom) {
      await dom.click()
    }
    waitIdle(page)
    const supportQuality = ![".png"].some((i) =>
      imagePath.toLowerCase().endsWith(i)
    )

    const charId = type === 'sunburst' ? 'main' : 'canvas';
    const chart = await page.$(charId)
    if (!chart) {
      return false
    }
    const buffer = new Uint8Array(
      await chart.screenshot({
        quality: supportQuality ? quality : undefined,
        path: imagePath,
        fullPage: false,
      }),
    )
    await Promise.all([
      browser.close(),
    ])
    return buffer
  } catch (e) {
    console.log(e)
    return false
  }
}
