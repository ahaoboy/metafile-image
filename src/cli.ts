import * as yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { metafileImage } from "./tool"

const args = yargs(hideBin(process.argv))
  .option("width", {
    alias: "w",
    description: "viewport width, default: 3840",
    type: "number",
    default: 3840,
  })
  .option("height", {
    alias: "h",
    description: "viewport height, default: 2160",
    type: "number",
    default: 2160,
  }).option("mode", {
    alias: "m",
    description: "mode(dark | light)",
    type: "string",
  })
  .option("quality", {
    alias: "q",
    description: "quality(0-100)",
    type: "number",
    default: 100,
  })
  .option("type", {
    alias: "t",
    description: "type(treemap | sunburst | flame)",
    type: "string",
  })
  .option("timeout", {
    description: "timeout(5min=1000 * 60 * 5)",
    type: "number",
    default: 1000 * 60 * 5,
  })
  .positional("metafile", {
    description: "metafile path",
    type: "string",
    demandOption: true,
  })
  .positional("image", {
    description: "image path",
    type: "string",
    demandOption: true,
  })
  .parseSync()

const { width, height, quality, mode, type, timeout } = args
const [metafile, image] = args._ as string[]
if (!metafile || !image) {
  console.log("metafile-image <metafile.json> <image.png>")
  process.exit()
}

metafileImage(metafile, image, { mode, width, height, quality, type, timeout })
