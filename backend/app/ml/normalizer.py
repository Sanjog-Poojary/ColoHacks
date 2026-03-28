from rapidfuzz import process, utils
import logging

logger = logging.getLogger(__name__)

def normalize_item_name(name: str, known_items: list[str]) -> str:
    """
    Normalizes item names by matching them against a known list of canonical items.
    > [!NOTE]
    > If a match is found with a score >= 80, the canonical name is returned.
    > If no match is found, the item is added to the list of known products.
    """
    if not name or not name.strip():
        return "Unknown Item"
    
    clean_name = name.lower().strip()
    
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
