import unicodedata
from rapidfuzz import process, utils
import logging

logger = logging.getLogger(__name__)

# Common Hindi-English Synonyms for Indian Business Ledger
SYNONYM_MAP = {
    'aam': 'Mango',
    '\u0906\u092e': 'Mango', # आम
    'mango': 'Mango',
    'aloo': 'Potato',
    '\u0906\u0932\u0942': 'Potato', # आलू
    'potato': 'Potato',
    'tamatar': 'Tomato',
    '\u091f\u092e\u093e\u091f\u0930': 'Tomato', # टमाटर
    'tomato': 'Tomato',
    'kela': 'Banana',
    '\u0915\u0947\u0932\u093e': 'Banana', # केला
    'banana': 'Banana',
    'seb': 'Apple',
    '\u0938\u0947\u092c': 'Apple', # सेब
    'apple': 'Apple',
    'pyaz': 'Onion',
    '\u092a\u094d\u092f\u093e\u091c': 'Onion', # प्याज
    'onion': 'Onion',
    'adrak': 'Ginger',
    '\u0905\u0926\u0930\u0915': 'Ginger', # अदरक
    'ginger': 'Ginger',
    'lasun': 'Garlic',
    '\u0932\u0939\u0938\u0941\u0928': 'Garlic', # लहसुन
    'garlic': 'Garlic',
    'mirch': 'Chilli',
    '\u092e\u093f\u0930\u094d\u091a': 'Chilli', # मिर्च
    'chilli': 'Chilli',
    'chile': 'Chilli',
    'dudh': 'Milk',
    '\u0926\u0942\u0927': 'Milk', # दूध
    'milk': 'Milk',
    'dahi': 'Curd',
    '\u0926\u0939\u0940': 'Curd', # दही
    'curd': 'Curd',
    'yogurt': 'Curd',
    'paneer': 'Paneer',
    '\u092a\u0928\u0940\u0930': 'Paneer', # पनीर
    'chawal': 'Rice',
    '\u091a\u093e\u0932': 'Rice', # चावल (Simplified match)
    'rice': 'Rice',
    'atta': 'Flour',
    '\u0906\u091f\u093e': 'Flour', # आटा
    'flour': 'Flour',
    'daal': 'Lentils',
    '\u0926\u093e\u0932': 'Lentils', # दाल
    'lentils': 'Lentils'
}

def normalize_item_name(name: str, known_items: list[str]) -> str:
    """
    Normalizes item names by matching them against a known list of canonical items.
    > [!NOTE]
    > Includes a synonym map for Hindi/English cross-language aggregation.
    """
    if not name or not name.strip():
        return "Unknown Item"
    
    # Standardize Unicode (NFC is most compatible for Hindi/Devanagari)
    clean_name = unicodedata.normalize('NFC', name.lower().strip())

    # 0. Synonym Check (Cross-language aggregation)
    if clean_name in SYNONYM_MAP:
        canonical = SYNONYM_MAP[clean_name]
        logger.info(f"DIRECT SYNONYM MATCH: '{name}' -> '{canonical}'")
        if canonical not in known_items:
            known_items.append(canonical)
        return canonical
    
    # 0.1 Fuzzy Synonym Check (Handle encoding/variation in Hindi)
    fuzzy_syn = process.extractOne(
        clean_name, 
        SYNONYM_MAP.keys(),
        processor=utils.default_process,
        score_cutoff=90 # High threshold for synonyms
    )
    if fuzzy_syn:
        canonical = SYNONYM_MAP[fuzzy_syn[0]]
        logger.info(f"FUZZY SYNONYM MATCH: '{name}' matches key '{fuzzy_syn[0]}' -> '{canonical}'")
        if canonical not in known_items:
            known_items.append(canonical)
        return canonical

    # Also check the original case version in the map
    alt_clean = unicodedata.normalize('NFC', name.strip())
    if alt_clean in SYNONYM_MAP:
        return SYNONYM_MAP[alt_clean]
    
    logger.debug(f"Proceeding to fuzzy normalization for: '{name}' (clean: '{clean_name}')")
    
    # 1. Direct Match Check
    if clean_name in [k.lower() for k in known_items]:
        # Return the original case from the known list
        for k in known_items:
            if k.lower() == clean_name:
                return k
                
    # 2. Fuzzy Match Check
    if known_items:
        match = process.extractOne(
            clean_name, 
            known_items,
            processor=utils.default_process,
            score_cutoff=80
        )
        if match:
            # match[0] is the matched string
            return match[0]
            
    # 3. New Item Discovered
    known_items.append(name.capitalize())
    return name.capitalize()

def batch_normalize(items: list[str]) -> dict:
    """
    Groups items into canonical names.
    Useful for batch processing history.
    """
    known = []
    mapping = {}
    for item in items:
        canonical = normalize_item_name(item, known)
        mapping[item] = canonical
    return mapping
