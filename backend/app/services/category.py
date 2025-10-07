"""
Document categorization service with intelligent auto-categorization.
"""
import re
from typing import Dict, List, Tuple, Optional


class CategoryService:
    """Service for intelligent document categorization."""
    
    # Document categories with priority weighting
    CATEGORIES = {
        "invoice": {
            "display_name": "Invoice",
            "description": "Bills, invoices, and purchase receipts",
            "priority": 2,
            "keywords": [
                "invoice", "bill", "receipt", "purchase", "payment due", "amount due",
                "subtotal", "total", "tax", "vat", "gst", "invoice number", "bill number",
                "vendor", "supplier", "due date", "payment terms", "remit to", "billing"
            ]
        },
        "medical": {
            "display_name": "Medical",
            "description": "Medical bills, prescriptions, insurance claims",
            "priority": 3,
            "keywords": [
                "medical", "prescription", "pharmacy", "doctor", "hospital", "clinic",
                "health", "medicare", "medicaid", "insurance claim", "patient", "diagnosis",
                "treatment", "medication", "rx", "physician", "nurse", "lab", "test results"
            ]
        },
        "insurance": {
            "display_name": "Insurance",
            "description": "Insurance policies, claims, and documents",
            "priority": 4,
            "keywords": [
                "insurance", "policy", "premium", "claim", "coverage", "deductible",
                "policyholder", "beneficiary", "underwriter", "liability", "auto insurance",
                "home insurance", "life insurance", "health insurance", "claim number"
            ]
        },
        "tax": {
            "display_name": "Tax",
            "description": "Tax documents, returns, and related paperwork",
            "priority": 5,
            "keywords": [
                "tax", "irs", "form", "1040", "w2", "w4", "1099", "deduction", "refund",
                "withholding", "filing", "return", "federal", "state", "income tax",
                "property tax", "sales tax", "tax year", "ein", "ssn", "tax id"
            ]
        },
        "financial": {
            "display_name": "Financial",
            "description": "Bank statements, loans, investments",
            "priority": 6,
            "keywords": [
                "bank", "statement", "account", "balance", "transaction", "deposit",
                "withdrawal", "loan", "mortgage", "credit", "investment", "portfolio",
                "savings", "checking", "routing", "swift", "iban", "interest", "dividend"
            ]
        },
        "warranty": {
            "display_name": "Warranty",
            "description": "Warranty cards and product guarantees",
            "priority": 7,
            "keywords": [
                "warranty", "guarantee", "warrantee", "coverage", "repair", "replacement",
                "product registration", "serial number", "model number", "manufacturer",
                "defect", "malfunction", "terms and conditions", "expiration", "valid until"
            ]
        },
        "utility": {
            "display_name": "Utility",
            "description": "Utility bills and service providers",
            "priority": 8,
            "keywords": [
                "utility", "electric", "electricity", "gas", "water", "sewer", "internet",
                "cable", "phone", "wireless", "cellular", "broadband", "service", "usage",
                "meter", "kilowatt", "kwh", "therms", "gallons", "data", "minutes"
            ]
        },
        "legal": {
            "display_name": "Legal",
            "description": "Legal documents, contracts, and agreements",
            "priority": 9,
            "keywords": [
                "legal", "contract", "agreement", "lease", "rental", "terms", "conditions",
                "attorney", "lawyer", "court", "lawsuit", "settlement", "notary", "witness",
                "signature", "bind", "obligation", "clause", "amendment", "addendum"
            ]
        },
        "employment": {
            "display_name": "Employment",
            "description": "Employment documents, pay stubs, HR paperwork",
            "priority": 10,
            "keywords": [
                "employment", "payroll", "paystub", "salary", "wage", "employee", "employer",
                "hr", "human resources", "benefits", "vacation", "sick leave", "pension",
                "401k", "offer letter", "termination", "resignation", "performance review"
            ]
        },
        "automotive": {
            "display_name": "Automotive",
            "description": "Vehicle documents, registration, maintenance",
            "priority": 11,
            "keywords": [
                "vehicle", "car", "auto", "automotive", "registration", "title", "license",
                "maintenance", "repair", "service", "oil change", "inspection", "smog",
                "emissions", "vin", "mileage", "dealer", "garage", "mechanic", "parts"
            ]
        },
        "real_estate": {
            "display_name": "Real Estate",
            "description": "Property documents, deeds, mortgage papers",
            "priority": 12,
            "keywords": [
                "real estate", "property", "deed", "mortgage", "escrow", "closing", "title",
                "appraisal", "inspection", "realtor", "agent", "broker", "listing", "mls",
                "hoa", "homeowners association", "property tax", "assessment", "survey"
            ]
        },
        "subscription": {
            "display_name": "Subscription",
            "description": "Subscription services and recurring payments",
            "priority": 13,
            "keywords": [
                "subscription", "recurring", "monthly", "annual", "membership", "service",
                "streaming", "software", "saas", "renewal", "auto-pay", "billing cycle",
                "netflix", "spotify", "amazon prime", "office 365", "adobe", "gym"
            ]
        },
        "government": {
            "display_name": "Government",
            "description": "Government documents and official paperwork",
            "priority": 14,
            "keywords": [
                "government", "federal", "state", "local", "department", "agency", "bureau",
                "passport", "visa", "license", "permit", "certificate", "dmv", "social security",
                "unemployment", "benefits", "veteran", "military", "court", "jury", "voting"
            ]
        },
        "business": {
            "display_name": "Business",
            "description": "Business documents and corporate paperwork",
            "priority": 15,
            "keywords": [
                "business", "company", "corporation", "llc", "partnership", "contract",
                "vendor", "supplier", "client", "customer", "proposal", "quote", "estimate",
                "purchase order", "delivery", "shipping", "tracking", "wholesale", "retail"
            ]
        },
        "travel": {
            "display_name": "Travel",
            "description": "Travel documents, tickets, and itineraries",
            "priority": 16,
            "keywords": [
                "travel", "flight", "airline", "hotel", "reservation", "booking", "ticket",
                "itinerary", "boarding pass", "passport", "visa", "customs", "immigration",
                "rental car", "cruise", "vacation", "trip", "departure", "arrival", "gate"
            ]
        },
        "education": {
            "display_name": "Education",
            "description": "Educational documents, transcripts, and certificates",
            "priority": 17,
            "keywords": [
                "education", "school", "university", "college", "transcript", "diploma",
                "certificate", "degree", "student", "tuition", "scholarship", "financial aid",
                "loan", "grant", "enrollment", "registration", "class", "course", "grade"
            ]
        },
        "personal": {
            "display_name": "Personal",
            "description": "Personal documents and records",
            "priority": 18,
            "keywords": [
                "personal", "family", "birth certificate", "marriage", "divorce", "death",
                "adoption", "custody", "child support", "alimony", "inheritance", "will",
                "trust", "estate", "power of attorney", "guardian", "conservator"
            ]
        },
        "other": {
            "display_name": "Other",
            "description": "Miscellaneous documents that don't fit other categories",
            "priority": 19,
            "keywords": []
        }
    }
    
    @classmethod
    def get_categories(cls) -> List[Dict]:
        """Get all available categories."""
        return [
            {
                "name": name,
                "display_name": info["display_name"],
                "description": info["description"]
            }
            for name, info in cls.CATEGORIES.items()
        ]
    
    @classmethod
    def auto_categorize(cls, filename: str, extracted_text: str = "") -> Tuple[str, float, List[str]]:
        """
        Automatically categorize a document based on filename and content.
        
        Returns:
            tuple: (category_name, confidence_score, matched_keywords)
        """
        # Combine filename and text for analysis
        content = f"{filename} {extracted_text}".lower()
        
        # Remove special characters and extra whitespace
        content = re.sub(r'[^\w\s]', ' ', content)
        content = re.sub(r'\s+', ' ', content).strip()
        
        category_scores = {}
        matched_keywords_per_category = {}
        
        # Score each category
        for category_name, category_info in cls.CATEGORIES.items():
            if category_name == "other":  # Skip 'other' category in scoring
                continue
                
            score = 0
            matched_keywords = []
            
            # Check for keyword matches
            for keyword in category_info["keywords"]:
                if keyword.lower() in content:
                    # Base score for keyword match
                    keyword_score = 10
                    
                    # Bonus for exact word boundary matches
                    if re.search(rf'\b{re.escape(keyword.lower())}\b', content):
                        keyword_score += 5
                    
                    # Bonus for filename matches (higher relevance)
                    if keyword.lower() in filename.lower():
                        keyword_score += 10
                    
                    score += keyword_score
                    matched_keywords.append(keyword)
            
            # Apply priority weighting (lower priority number = higher importance)
            priority_weight = 1.0 / category_info["priority"]
            weighted_score = score * priority_weight
            
            if weighted_score > 0:
                category_scores[category_name] = weighted_score
                matched_keywords_per_category[category_name] = matched_keywords
        
        # Find the best category
        if category_scores:
            best_category = max(category_scores, key=category_scores.get)
            confidence = min(category_scores[best_category] / 50.0, 1.0)  # Normalize to 0-1
            matched_keywords = matched_keywords_per_category[best_category]
        else:
            best_category = "other"
            confidence = 0.0
            matched_keywords = []
        
        return best_category, confidence, matched_keywords
    
    @classmethod
    def validate_category(cls, category: str) -> bool:
        """Validate if a category exists."""
        return category in cls.CATEGORIES
    
    @classmethod
    def normalize_category_input(cls, user_input: str) -> Optional[str]:
        """
        Normalize user input to a valid category name.
        Handles common variations and typos.
        """
        if not user_input:
            return None
            
        user_input = user_input.lower().strip()
        
        # Direct match
        if user_input in cls.CATEGORIES:
            return user_input
        
        # Check display names
        for category_name, info in cls.CATEGORIES.items():
            if user_input == info["display_name"].lower():
                return category_name
        
        # Common variations and aliases
        category_aliases = {
            "bill": "invoice",
            "receipt": "invoice", 
            "medical": "medical",
            "health": "medical",
            "doctor": "medical",
            "prescription": "medical",
            "bank": "financial",
            "statement": "financial",
            "loan": "financial",
            "investment": "financial",
            "car": "automotive",
            "vehicle": "automotive",
            "auto": "automotive",
            "house": "real_estate",
            "home": "real_estate",
            "property": "real_estate",
            "work": "employment",
            "job": "employment",
            "payroll": "employment",
            "pay": "employment",
            "school": "education",
            "university": "education",
            "college": "education",
            "govt": "government",
            "federal": "government",
            "state": "government"
        }
        
        return category_aliases.get(user_input)