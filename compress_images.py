import os
from PIL import Image

def compress_images(directory, max_size_kb=300):
    for root, dirs, files in os.walk(directory):
        for file in files:
            ext = file.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png', 'webp']:
                filepath = os.path.join(root, file)
                original_size = os.path.getsize(filepath) / 1024
                
                if original_size > max_size_kb:
                    print(f"Compressing: {filepath} ({original_size:.1f} KB)")
                    try:
                        with Image.open(filepath) as img:
                            old_format = img.format
                            # Some PNGs might need RGB conversion if they have transparency and to be saved as JPG, 
                            # but we are just saving back to their own format with quality reduced.
                            if ext in ['jpg', 'jpeg']:
                                img.save(filepath, "JPEG", optimize=True, quality=75)
                            elif ext == 'png':
                                # Optimize PNG size
                                img.save(filepath, "PNG", optimize=True)
                            elif ext == 'webp':
                                img.save(filepath, "WEBP", quality=75)
                                
                        new_size = os.path.getsize(filepath) / 1024
                        print(f" -> Reduced to {new_size:.1f} KB")
                        
                        # If still too large, forcefully resize
                        if new_size > max_size_kb:
                            with Image.open(filepath) as img:
                                img.thumbnail((1200, 1200))
                                if ext in ['jpg', 'jpeg']:
                                    img.save(filepath, "JPEG", optimize=True, quality=60)
                                elif ext == 'png':
                                    img.save(filepath, "PNG", optimize=True)
                                elif ext == 'webp':
                                    img.save(filepath, "WEBP", quality=60)
                            print(f" -> Resized and reduced to {os.path.getsize(filepath) / 1024:.1f} KB")
                    except Exception as e:
                        print(f"Failed to compress {filepath}: {e}")

if __name__ == '__main__':
    compress_images('assets')
