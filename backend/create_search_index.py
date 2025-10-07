#!/usr/bin/env python3
"""Create Azure Search index programmatically."""

import json
import os
import sys
sys.path.append('/app')

import requests

def create_search_index():
    """Create the documents-index in Azure Search."""
    
    # Read environment variables
    search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
    search_key = os.getenv("AZURE_SEARCH_API_KEY")
    
    if not search_endpoint or not search_key:
        print("ERROR: Azure Search endpoint and key must be configured")
        return False
    
    # Read the index schema
    try:
        with open('/app/azure-search-index.json', 'r') as f:
            index_schema = json.load(f)
    except FileNotFoundError:
        print("ERROR: azure-search-index.json not found")
        return False
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in azure-search-index.json: {e}")
        return False
    
    # Prepare the API request
    url = f"{search_endpoint}/indexes?api-version=2023-11-01"
    headers = {
        "Content-Type": "application/json",
        "api-key": search_key
    }
    
    print(f"Creating index at: {url}")
    print(f"Index name: {index_schema.get('name', 'Unknown')}")
    
    try:
        # Create the index
        response = requests.post(url, headers=headers, json=index_schema)
        
        if response.status_code == 201:
            print("✅ Index created successfully!")
            return True
        elif response.status_code == 409:
            print("⚠️  Index already exists")
            return True
        else:
            print(f"❌ Failed to create index. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating index: {e}")
        return False

if __name__ == "__main__":
    success = create_search_index()
    if success:
        print("\n🎉 Ready to index documents!")
    else:
        print("\n💥 Please create the index manually in Azure Portal")