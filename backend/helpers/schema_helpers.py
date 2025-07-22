# backend/helpers/schema_helpers.py

def get_table_schema(table_name: str) -> list[dict]:
    """
    Return column definitions for a given table.
    This defines what columns the frontend expects to render for the grid.

    Each column should have:
    - id: database field name
    - type: frontend cell type (e.g., text, choice, reference, boolean, date, etc.)
    - label: display label (optional, defaults to id)
    - options: (optional) for choice/reference types

    """

    if table_name == "suppliers":
        return [
            {"id": "name", "type": "text", "label": "Supplier Name"},
            {"id": "contact_name", "type": "text", "label": "Contact Name"},
            {"id": "email", "type": "link", "label": "Email"},
            {"id": "phone", "type": "text", "label": "Phone"},
            {"id": "address", "type": "text", "label": "Address"},
            {"id": "created_at", "type": "date", "label": "Created"},
        ]

    if table_name == "products":
        return [
            {"id": "name", "type": "text", "label": "Product Name"},
            {"id": "sku", "type": "text", "label": "SKU"},
            {"id": "category", "type": "choice", "label": "Category"},
            {"id": "supplier_id", "type": "reference", "label": "Supplier"},
            {"id": "price", "type": "currency", "label": "Price"},
            {"id": "created_at", "type": "date", "label": "Created"},
        ]

    # Add more tables as needed...
    
    return []
