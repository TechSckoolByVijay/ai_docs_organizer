# Azure AI Search and Blob Storage Integration

This document organizer now supports Azure AI Search for intelligent vector-based search and Azure Blob Storage for scalable cloud file storage.

## Features

### Azure AI Search
- **Vector Search**: Uses OpenAI embeddings for semantic similarity search
- **Hybrid Search**: Combines text search, vector search, and semantic search
- **Intelligent Ranking**: Advanced scoring with semantic reranking
- **Multilingual Support**: Works with documents in multiple languages

### Azure Blob Storage
- **Scalable Storage**: Cloud-based file storage with automatic scaling
- **Secure Access**: SAS URLs for secure file access without exposing storage keys
- **User Isolation**: Files organized by user ID for data separation
- **Metadata Management**: Rich metadata support for enhanced file management

### Fallback Architecture
- **Graceful Degradation**: Automatically falls back to local storage and PostgreSQL search
- **No Vendor Lock-in**: Can operate without Azure services if needed
- **Hybrid Mode**: Can use Azure Search with local storage or vice versa

## Setup Instructions

### 1. Azure Services Setup

#### Azure AI Search
1. Create an Azure AI Search service in the Azure Portal
2. Note down the service name and admin API key
3. Create a search index using the provided `azure-search-index.json` schema
4. Enable semantic search on your search service

#### Azure Blob Storage
1. Create an Azure Storage Account
2. Create a container named `documents` (or customize the name)
3. Note down the storage account name and access key

#### OpenAI API
1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Ensure you have access to the `text-embedding-ada-002` model

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your Azure credentials:

```bash
# Azure AI Search Configuration
AZURE_SEARCH_SERVICE_NAME=your-search-service-name
AZURE_SEARCH_API_KEY=your-search-api-key
AZURE_SEARCH_INDEX_NAME=docs-index

# Azure Blob Storage Configuration  
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
AZURE_STORAGE_CONTAINER_NAME=documents

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
```

### 3. Create Search Index

Use the Azure Portal or Azure CLI to create the search index:

```bash
# Using Azure CLI
az search index create --service-name your-search-service-name --name docs-index --body @azure-search-index.json
```

Or upload `azure-search-index.json` through the Azure Portal in your Search Service > Indexes section.

### 4. Start the Application

```bash
# Start with Docker Compose
docker-compose up -d

# Or start backend only
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing Azure Integration

### Health Check Endpoint
Test your Azure services connectivity:

```bash
curl -X GET "http://localhost:8000/api/azure/test-connectivity" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response will show the status of each service:
```json
{
  "user_id": 1,
  "azure_search": {
    "status": "connected",
    "details": "Connected to https://your-service.search.windows.net",
    "index_name": "docs-index"
  },
  "azure_blob": {
    "status": "connected", 
    "details": "Connected to your-storage-account",
    "container_name": "documents"
  },
  "openai": {
    "status": "connected",
    "details": "Embedding model working, dimension: 1536",
    "model": "text-embedding-ada-002"
  },
  "overall_status": "fully_connected"
}
```

### Migration Endpoint
Reindex existing documents to Azure Search:

```bash
curl -X POST "http://localhost:8000/api/azure/reindex-documents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Search Capabilities

### Enhanced Search Features
1. **Semantic Search**: Understands meaning and context
2. **Vector Similarity**: Finds documents with similar concepts
3. **Hybrid Ranking**: Combines multiple search signals
4. **Typo Tolerance**: Handles misspellings and variations
5. **Multi-language**: Works across different languages

### Search API Usage

```python
# Search with Azure AI Search (automatic if configured)
GET /api/search/documents?q=medical receipt&category=health&limit=10

# Results include relevance scores and highlighted snippets
{
  "status": "success",
  "data": {
    "documents": [...],
    "total": 25,
    "execution_time_ms": 45.7,
    "search_type": "azure_hybrid"
  }
}
```

## Architecture

### Service Layer
- `AzureSearchService`: Handles vector embeddings and search operations
- `AzureBlobService`: Manages cloud file storage and SAS URLs  
- `DocumentService`: Orchestrates between Azure services and local fallbacks
- `SearchService`: Provides unified search interface with fallback logic

### Data Flow
1. **Document Upload**: File → Blob Storage → Text Extraction → Vector Embedding → Search Index
2. **Document Search**: Query → Vector Embedding → Hybrid Search → Ranked Results
3. **File Access**: Request → SAS URL Generation → Secure Download

### Security
- SAS URLs with expiration for secure file access
- User-scoped search results and file access
- API key management through environment variables
- No direct storage account exposure to clients

## Performance Considerations

### Vector Search Performance
- HNSW algorithm for fast approximate nearest neighbor search
- Configurable search parameters for speed vs. accuracy trade-offs
- Batch processing for large-scale indexing operations

### Cost Optimization
- Embedding caching to reduce OpenAI API calls
- Selective reindexing for document updates
- Automatic cleanup of orphaned blob storage files

### Monitoring
- Azure Search query metrics and performance insights
- Blob storage access patterns and costs
- OpenAI API usage tracking

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API keys and service names
   - Check Azure service status and quotas
   - Ensure proper RBAC permissions

2. **Search Index Issues**
   - Verify index schema matches `azure-search-index.json`
   - Check indexer status and error logs
   - Validate document format and field mappings

3. **Blob Storage Issues**
   - Verify container exists and is accessible
   - Check storage account firewall rules
   - Validate SAS URL generation and expiration

4. **Embedding Issues**
   - Verify OpenAI API key and quota
   - Check embedding model availability
   - Monitor API rate limits and costs

### Debug Mode
Enable debug logging by setting `DEBUG=True` in your environment:

```bash
DEBUG=True
```

This will provide detailed error messages and Azure service call logging.

## Migration from Local to Azure

### Gradual Migration
1. Start with Azure services configured but not required
2. Test search functionality with new documents
3. Use the reindex endpoint to migrate existing documents
4. Monitor performance and adjust configuration
5. Optionally disable local fallbacks once confident

### Rollback Plan
- Azure services are optional - local storage and search continue to work
- Set `FORCE_AZURE_SERVICES=false` to allow fallback
- Can migrate back by simply removing Azure configuration

## API Reference

### Azure Service Endpoints

- `GET /api/azure/test-connectivity` - Test Azure services connectivity
- `POST /api/azure/reindex-documents` - Reindex all user documents to Azure Search
- `GET /api/azure/search-index-stats` - Get search index statistics

### Enhanced Search Endpoints

- `GET /api/search/documents` - Search documents (automatically uses Azure if available)
- `POST /api/search/query` - Advanced search with custom parameters

## Support

For issues related to:
- **Azure Services**: Check Azure Portal service health and logs
- **OpenAI API**: Monitor usage and quotas in OpenAI dashboard  
- **Application**: Check application logs and health endpoints