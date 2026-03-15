from rembg import remove
from PIL import Image

input_path = "public/hero-boy.png"
output_path = "public/hero-boy-nobg.png"

input = Image.open(input_path)
output = remove(input)
output.save(output_path)
print("Background removed successfully!")
