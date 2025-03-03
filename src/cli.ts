import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { metafileImage } from './tool';

const args = yargs(hideBin(process.argv))
  .option('width', {
    alias: 'w',
    description: 'viewport width',
    type: 'number',
    default: 3840
  })
  .option('height', {
    alias: 'h',
    description: 'viewport height',
    type: 'number',
    default: 2160
  })
  .option('quality', {
    alias: 'q',
    description: 'quality',
    type: 'number',
    default: 100
  })
  .positional('metafile', {
    description: 'metafile path',
    type: 'string',
    demandOption: true
  })
  .positional('image', {
    description: 'image path',
    type: 'string',
    demandOption: true
  })
  .parseSync()

const { width, height, quality } = args
const [metafile, image] = args._ as string[]
if (!metafile || !image) {
  console.log('metafile-image <metafile.json> <image.png>')
  process.exit()
}

metafileImage(metafile, image, width, height, quality)