"""
File processing service for text extraction and content analysis.
"""
import os
import mimetypes
from typing import Optional, Tuple
from PIL import Image
import pytesseract
import PyPDF2
from io import BytesIO


class FileProcessingService:
    """Service for processing uploaded files and extracting text."""
    
    def __init__(self):
        # Configure OCR settings
        self.ocr_config = '--oem 3 --psm 6'  # OCR Engine Mode 3, Page Segmentation Mode 6
        
        # Supported file types for processing
        self.text_extractable_types = {
            'application/pdf': self._extract_pdf_text,
            'image/jpeg': self._extract_image_text,
            'image/jpg': self._extract_image_text,
            'image/png': self._extract_image_text,
            'image/gif': self._extract_image_text,
            'image/tiff': self._extract_image_text,
            'image/bmp': self._extract_image_text,
        }
    
    def can_extract_text(self, content_type: str) -> bool:
        """Check if text can be extracted from this file type."""
        return content_type in self.text_extractable_types
    
    def extract_text(self, file_path: str, content_type: str) -> Tuple[str, str]:
        """
        Extract text from a file.
        
        Args:
            file_path: Path to the file
            content_type: MIME type of the file
            
        Returns:
            Tuple of (extracted_text, detected_intent)
        """
        try:
            if not os.path.exists(file_path):
                return "", ""
            
            if content_type not in self.text_extractable_types:
                return "", ""
            
            # Extract text using appropriate method
            extractor = self.text_extractable_types[content_type]
            extracted_text = extractor(file_path)
            
            # Clean and normalize text
            cleaned_text = self._clean_text(extracted_text)
            
            # Detect document intent/purpose
            detected_intent = self._detect_intent(cleaned_text)
            
            return cleaned_text, detected_intent
            
        except Exception as e:
            print(f"Error extracting text from {file_path}: {str(e)}")
            return "", ""
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file."""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            print(f"Error extracting PDF text: {str(e)}")
            return ""
    
    def _extract_image_text(self, file_path: str) -> str:
        """Extract text from image using OCR."""
        try:
            # Open and process image
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Enhance image for better OCR
                img = self._enhance_image_for_ocr(img)
                
                # Perform OCR
                text = pytesseract.image_to_string(img, config=self.ocr_config)
                
                return text.strip()
                
        except Exception as e:
            print(f"Error extracting image text: {str(e)}")
            return ""
    
    def _enhance_image_for_ocr(self, img: Image.Image) -> Image.Image:
        """Enhance image quality for better OCR results."""
        try:
            # Resize if image is too small (OCR works better on larger images)
            width, height = img.size
            if width < 1000 or height < 1000:
                scale_factor = max(1000 / width, 1000 / height)
                new_size = (int(width * scale_factor), int(height * scale_factor))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Convert to grayscale for better text recognition
            img = img.convert('L')
            
            return img
            
        except Exception as e:
            print(f"Error enhancing image: {str(e)}")
            return img
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Remove very long lines that are likely OCR errors
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            # Skip empty lines and lines with too many special characters
            if line and len(line) > 2:
                special_char_ratio = sum(1 for c in line if not c.isalnum() and c != ' ') / len(line)
                if special_char_ratio < 0.5:  # Less than 50% special characters
                    cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _detect_intent(self, text: str) -> str:
        """Detect the intent/purpose of the document based on content."""
        if not text:
            return ""
        
        text_lower = text.lower()
        
        # Intent detection patterns
        intent_patterns = {
            "receipt": ["receipt", "purchase", "sale", "bought", "paid", "transaction", "subtotal"],
            "invoice": ["invoice", "bill", "amount due", "payment due", "billing", "invoice number"],
            "medical": ["doctor", "physician", "patient", "medical", "clinic", "hospital", "prescription", "rx"],
            "insurance": ["insurance", "policy", "claim", "coverage", "premium", "deductible"],
            "tax": ["tax", "irs", "form", "w2", "1040", "1099", "return", "filing"],
            "financial": ["bank", "account", "statement", "balance", "deposit", "withdrawal"],
            "utility": ["utility", "electric", "gas", "water", "service", "usage", "meter"],
            "legal": ["contract", "agreement", "legal", "terms", "conditions", "attorney"],
            "warranty": ["warranty", "guarantee", "coverage", "repair", "replacement"],
            "employment": ["employee", "employer", "payroll", "salary", "wage", "benefits"]
        }
        
        # Count matches for each intent
        intent_scores = {}
        for intent, keywords in intent_patterns.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                intent_scores[intent] = score
        
        # Return the intent with the highest score
        if intent_scores:
            best_intent = max(intent_scores, key=intent_scores.get)
            return best_intent
        
        return "document"
    
    def get_file_info(self, file_path: str) -> dict:
        """Get detailed information about a file."""
        try:
            if not os.path.exists(file_path):
                return {}
            
            stat = os.stat(file_path)
            content_type, _ = mimetypes.guess_type(file_path)
            
            info = {
                'size': stat.st_size,
                'modified': stat.st_mtime,
                'content_type': content_type or 'application/octet-stream',
                'can_extract_text': self.can_extract_text(content_type or ''),
            }
            
            # Add image-specific info if it's an image
            if content_type and content_type.startswith('image/'):
                try:
                    with Image.open(file_path) as img:
                        info['dimensions'] = img.size
                        info['format'] = img.format
                        info['mode'] = img.mode
                except Exception:
                    pass
            
            return info
            
        except Exception as e:
            print(f"Error getting file info: {str(e)}")
            return {}
    
    def validate_file_content(self, file_path: str, expected_type: str) -> bool:
        """Validate that file content matches expected type."""
        try:
            actual_type, _ = mimetypes.guess_type(file_path)
            
            # For security, verify the file is actually what it claims to be
            if expected_type.startswith('image/'):
                try:
                    with Image.open(file_path) as img:
                        img.verify()
                    return True
                except Exception:
                    return False
            
            elif expected_type == 'application/pdf':
                try:
                    with open(file_path, 'rb') as file:
                        PyPDF2.PdfReader(file)
                    return True
                except Exception:
                    return False
            
            # For other types, rely on mime type detection
            return actual_type == expected_type
            
        except Exception:
            return False