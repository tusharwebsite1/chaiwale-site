import pandas as pd
import json
import os
import sys
import re

# File Paths
EXCEL_FILE = '../data/menu.xlsx'
OUTPUT_JSON = '../data/menu.json'

def create_default_excel():
    print(f"Excel file not found. Creating a new one at {EXCEL_FILE}...")
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(EXCEL_FILE), exist_ok=True)
    
    # Define default data
    data = {
        'Category': ['Chai', 'Snacks'],
        'Name': ['Masala Chai', 'Samosa'],
        'Price': [20, 15],
        'Description': ['Classic Indian tea', 'Crispy samosa'],
        'VegNonVeg': ['Veg', 'Veg'],
        'Image': ['images/menu/masala-chai.jpg', 'images/menu/samosa.jpg'],
        'Active': [True, True]
    }
    
    df = pd.DataFrame(data)
    try:
        df.to_excel(EXCEL_FILE, index=False, engine='openpyxl')
        print(f"Excel file created successfully at {EXCEL_FILE}")
    except Exception as e:
        print(f"Error creating default excel: {e}")
        print("Please ensure you have openpyxl installed: pip install pandas openpyxl")
        sys.exit(1)

def parse_menu():
    print(f"Current Working Directory: {os.getcwd()}")
    print(f"Reading {EXCEL_FILE}...")
    
    if not os.path.exists(EXCEL_FILE):
        create_default_excel()
        
    try:
        # Load the excel file
        df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
        
        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        df_lower_cols = [str(c).lower() for c in df.columns]
        
        # Mapping standard required columns
        req_mapping = {}
        for req in ['category', 'name', 'price']:
            if req in df_lower_cols:
                req_mapping[req] = df.columns[df_lower_cols.index(req)]
            else:
                raise ValueError(f"Missing required column: {req}")

        # Fill NaNs with empty strings
        df = df.fillna('')
        
        menu_dict = {}
        
        for index, row in df.iterrows():
            # Skip if basic info is missing or if explicitly marked not active
            if 'active' in df_lower_cols:
                active_col = df.columns[df_lower_cols.index('active')]
                active_val = str(row[active_col]).strip().lower()
                if active_val in ['false', '0', 'no']:
                    continue

            category = str(row[req_mapping['category']]).strip()
            name = str(row[req_mapping['name']]).strip()
            
            if not category or not name:
                continue
                
            if category not in menu_dict:
                menu_dict[category] = []
                
            # Generate a clean ID from the name
            clean_id = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

            # Extract price and ensure it's numeric
            raw_price = str(row[req_mapping['price']]).replace(',', '').strip()
            try:
                price = float(raw_price) if '.' in raw_price else int(raw_price)
            except ValueError:
                price = raw_price # fallback if completely non-numeric
                
            # Handle Image Defaulting
            image = ""
            if 'image' in df_lower_cols:
                img_col = df.columns[df_lower_cols.index('image')]
                image = str(row[img_col]).strip()
            
            if not image:
                image = "images/menu/default.jpg"
                
            # Description processing
            description = ""
            if 'description' in df_lower_cols:
                desc_col = df.columns[df_lower_cols.index('description')]
                description = str(row[desc_col]).strip()
                
            # VegNonVeg processing
            vegnonveg = ""
            if 'vegnonveg' in df_lower_cols:
                vnv_col = df.columns[df_lower_cols.index('vegnonveg')]
                vegnonveg = str(row[vnv_col]).strip()
                
            item = {
                "id": clean_id,
                "name": name,
                "price": price,
                "image": image,
                "description": description,
                "vegnonveg": vegnonveg
            }
            menu_dict[category].append(item)
            
        # Ensure data dir exists for JSON
        os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
        
        # Write to JSON
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(menu_dict, f, indent=2, ensure_ascii=False)
            
        print(f"Successfully generated {OUTPUT_JSON} grouped by category.")
        
    except FileNotFoundError:
        print(f"File not found: {EXCEL_FILE}")
    except ValueError as ve:
        print(f"Input Error: {ve}")
    except Exception as e:
        print(f"Error parsing menu: {e}")
        print("Please ensure you have required dependencies installed: pip install pandas openpyxl")

if __name__ == "__main__":
    parse_menu()
