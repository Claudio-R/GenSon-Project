# Parse the epigenomic data to files organized by chrmosome and hyston type.

from pathlib import Path
entries = Path("C:/Users/mw/Desktop/GenSon Project/data/Peaks")
outputs = Path("C:/Users/mw/Desktop/GenSon Project/data/PeaksParsed")

for entry in entries.iterdir():
  name = entry.name
  lines = entry.read_text().splitlines()
  for line in lines:
    chr = line.split("\t")[0]
    with open(outputs / f"{chr}" / f"{chr}_{name}", "a") as f:
      f.write(line + "\n")
