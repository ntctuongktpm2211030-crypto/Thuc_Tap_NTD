import fitz
from collections import Counter

pdf = fitz.open("book.pdf")

fonts = Counter()

for page in pdf:
    blocks = page.get_text("dict")["blocks"]

    for block in blocks:

        if "lines" not in block:
            continue

        for line in block["lines"]:

            for span in line["spans"]:

                text = span["text"].strip()

                if len(text) < 3:
                    continue

                key = (
                    round(span["size"],1),
                    span["font"]
                )

                fonts[key] += 1

print()

for k,v in fonts.most_common():

    print(k,v)