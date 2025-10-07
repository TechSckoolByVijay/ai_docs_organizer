"""
Setup script for initializing the database and running migrations.
"""
import os
import subprocess
import sys
from pathlib import Path


def run_command(command, cwd=None):
    """Run a shell command and print output."""
    print(f"Running: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            capture_output=True, 
            text=True,
            cwd=cwd
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False


def setup_environment():
    """Set up the development environment."""
    print("🚀 Setting up Document Organizer development environment...")
    
    # Check if we're in the right directory
    backend_dir = Path("backend")
    frontend_dir = Path("frontend")
    
    if not backend_dir.exists() or not frontend_dir.exists():
        print("❌ Please run this script from the project root directory")
        return False
    
    # Copy environment file
    env_example = Path(".env.example")
    env_file = Path(".env")
    
    if env_example.exists() and not env_file.exists():
        print("📋 Creating .env file from .env.example")
        import shutil
        shutil.copy(env_example, env_file)
        print("✅ .env file created. Please update it with your settings.")
    
    # Set up backend
    print("\n🐍 Setting up backend...")
    os.chdir("backend")
    
    # Create virtual environment (optional)
    print("Creating Python virtual environment (optional)...")
    run_command("python -m venv venv")
    
    # Install dependencies
    print("Installing Python dependencies...")
    if not run_command("pip install -r requirements.txt"):
        print("❌ Failed to install backend dependencies")
        return False
    
    # Initialize Alembic (if not already done)
    alembic_dir = Path("alembic")
    if not (alembic_dir / "versions").exists():
        print("Initializing database migrations...")
        run_command("alembic upgrade head")
    
    os.chdir("..")
    
    # Set up frontend
    print("\n⚛️ Setting up frontend...")
    os.chdir("frontend")
    
    # Install Node.js dependencies
    print("Installing Node.js dependencies...")
    if not run_command("npm install"):
        print("❌ Failed to install frontend dependencies")
        return False
    
    os.chdir("..")
    
    print("\n✅ Setup complete!")
    print("\n🐳 To start the application with Docker:")
    print("   docker-compose up -d")
    print("\n🔧 To start in development mode:")
    print("   Backend: cd backend && uvicorn app.main:app --reload")
    print("   Frontend: cd frontend && npm start")
    print("\n📊 Access points:")
    print("   Frontend: http://localhost:3000")
    print("   Backend API: http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    print("   pgAdmin: http://localhost:5050 (admin@receipts.com / admin123)")
    
    return True


if __name__ == "__main__":
    success = setup_environment()
    sys.exit(0 if success else 1)