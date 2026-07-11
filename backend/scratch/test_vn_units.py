import sys

try:
    import vietnamadminunits
    print("vietnamadminunits imported successfully!")
    print("Module attributes:")
    print(dir(vietnamadminunits))
    
    # Try to find variables or functions inside it
    for attr in dir(vietnamadminunits):
        if not attr.startswith('__'):
            val = getattr(vietnamadminunits, attr)
            print(f"  - {attr}: {type(val)}")
            if isinstance(val, (dict, list)) or hasattr(val, '__dict__'):
                # print a snippet of it
                print(f"    Content: {str(val)[:200]}")
except ImportError as e:
    print(f"Error importing vietnamadminunits: {e}")
