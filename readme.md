# Document Organizer

A comprehensive document and receipts management application with intelligent search capabilities, automated categorization, and modern web interface.

## 🎯 Features

- **Smart Document Upload**: Drag-and-drop file upload with camera capture support
- **AI-Powered Categorization**: Automatically categorize documents into 18+ categories
- **Intelligent Search**: Natural language search with text extraction from PDFs and images
- **Secure Authentication**: JWT-based user authentication with bcrypt password hashing
- **Modern UI**: Responsive React frontend with intuitive design
- **Document Management**: Upload, view, download, and delete documents
- **Search History**: Track and analyze search patterns
- **File Processing**: Text extraction from PDFs and OCR for images

## 🏗️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Primary database
- **Alembic**: Database migrations
- **JWT**: Token-based authentication
- **PyPDF2**: PDF text extraction
- **Pillow + Tesseract**: OCR for images

### Frontend
- **React.js**: Modern UI framework
- **Axios**: HTTP client for API calls
- **React Context**: State management
- **Responsive Design**: Mobile-friendly interface

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **pgAdmin**: Database administration
- **Nginx**: Reverse proxy (optional)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd my_docs_organizer
python setup.py  # Optional: sets up local development environment
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your settings (optional for Docker setup)
```

### 3. Start with Docker (Recommended)
```bash
docker-compose up -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050
  - Email: admin@receipts.com
  - Password: admin123

## 📁 Project Structure

```
my_docs_organizer/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── database.py     # Database configuration
│   │   ├── schemas.py      # Pydantic models
│   │   └── main.py         # FastAPI application
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api.js         # API client
│   │   ├── AuthContext.js # Authentication context
│   │   └── App.js         # Main application
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile
├── docker-compose.yml     # Multi-service configuration
├── setup.py              # Development setup script
└── README.md
```

## 🔧 Development Setup

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## 📊 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/token` - Login
- `GET /auth/me` - Get current user
- `GET /auth/verify` - Verify token

### Documents
- `POST /documents/upload` - Upload document
- `GET /documents/` - List documents
- `GET /documents/{id}` - Get document details
- `GET /documents/{id}/download` - Download document
- `DELETE /documents/{id}` - Delete document
- `GET /documents/categories` - Get categories

### Search
- `POST /search/` - Search documents
- `GET /search/history` - Get search history
- `GET /search/suggestions` - Get search suggestions
- `DELETE /search/history` - Clear search history

## 🏷️ Document Categories

The system supports 18 intelligent categories:

1. **Invoice** - Bills, invoices, and purchase receipts
2. **Medical** - Medical bills, prescriptions, insurance claims
3. **Insurance** - Insurance policies, claims, and documents
4. **Tax** - Tax documents, returns, and related paperwork
5. **Financial** - Bank statements, loans, investments
6. **Warranty** - Warranty cards and product guarantees
7. **Utility** - Utility bills and service providers
8. **Legal** - Legal documents, contracts, and agreements
9. **Employment** - Employment documents, pay stubs, HR paperwork
10. **Automotive** - Vehicle documents, registration, maintenance
11. **Real Estate** - Property documents, deeds, mortgage papers
12. **Subscription** - Subscription services and recurring payments
13. **Government** - Government documents and official paperwork
14. **Business** - Business documents and corporate paperwork
15. **Travel** - Travel documents, tickets, and itineraries
16. **Education** - Educational documents, transcripts, certificates
17. **Personal** - Personal documents and records
18. **Other** - Miscellaneous documents

## 🔍 Search Features

- **Natural Language Search**: Search with phrases like "medical bills from last month"
- **Category Filtering**: Filter results by document category
- **Text Extraction**: Automatically extract text from PDFs and images
- **Search History**: Track and review past searches
- **Smart Suggestions**: Get search suggestions based on document content

## 🔒 Security Features

- JWT token-based authentication
- Bcrypt password hashing
- File type validation
- Content-type verification
- User isolation (users can only access their own documents)
- CORS protection
- Environment variable configuration

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Drag-and-Drop Upload**: Easy file uploading
- **Camera Integration**: Take photos of documents on mobile
- **Dark Mode Ready**: Modern color scheme
- **Loading States**: Visual feedback for all operations
- **Error Handling**: Comprehensive error messages
- **Search Interface**: Intuitive search with examples

## 🐳 Docker Services

- **db**: PostgreSQL database
- **pgadmin**: Database administration interface
- **backend**: FastAPI application
- **frontend**: React development server
- **worker**: Background processing for Azure Service Bus message processing

## 📈 Future Enhancements

- Azure Cloud Integration
  - Azure Blob Storage for file storage
  - Azure AI Search for vector search
  - Azure Service Bus for async processing
  - OpenAI integration for content analysis
- OCR improvements with Azure Computer Vision
- Email document forwarding
- Document sharing and collaboration
- Advanced analytics and reporting
- Mobile app development
- Batch document processing

## 🛠️ Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml if needed
2. **Database connection**: Ensure PostgreSQL is running
3. **File upload issues**: Check file size limits and permissions
4. **OCR not working**: Install Tesseract OCR on the system

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d db
# Wait for database to start
docker-compose up -d
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support and questions:
- Check the documentation in `/docs`
- Review API documentation at http://localhost:8000/docs
- Create an issue in the repository
- Check the troubleshooting section above

---

**Built with ❤️ for better document organization**#   a i _ d o c s _ o r g a n i z e r  
 