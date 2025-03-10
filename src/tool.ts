import puppeteer, { Page } from "puppeteer"
import { existsSync } from "fs"

export type Type = "treemap" | "sunburst" | "flame"
export type Options = {
  mode: string
  width: number
  height: number
  quality: number
  timeout: number
  type: Type | (string & {})
  url: string
}

const DefaultOptions: Options = {
  mode: "",
  width: 3840,
  height: 2160,
  quality: 100,
  type: "treemap",
  // 5min
  timeout: 1000 * 60 * 5,
  url: "https://esbuild.github.io/analyze/",
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
    timeout,
    url,
  } = {
    ...DefaultOptions,
    ...options,
  }

  if (!existsSync(metafilePath)) {
    console.error("file not found: " + metafilePath)
    return false
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setViewport({ width, height })
    await page.goto(url, { waitUntil: "networkidle2", timeout })

    if (mode) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: mode },
      ])
    }

    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click("#importButton"),
    ])
    await fileChooser.accept([metafilePath])

    await page.waitForNetworkIdle()
    await page.waitForSelector("canvas", { timeout })

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

    const charId = type === "sunburst" ? "main" : "canvas"
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
    await browser.close()
    return buffer
  } catch (e) {
    console.error(e)
    return false
  }
}
