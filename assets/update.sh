type=(treemap sunburst flame)

for t in "${type[@]}"; do
  node cli/cli.js -m dark -t "${t}" assets/meta.json"assets/meta.${t}.webp"
done
