from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import PyPDF2
import torch
import transformers
from transformers import RobertaTokenizerFast
import os
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
from llmware.models import ModelCatalog
from pydantic import BaseModel
from typing import Dict
from llmware.prompts import Prompt
from llmware.setup import Setup
from llmware.parsers import Parser
from llmware.configs import LLMWareConfig
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
from PIL import Image
import pytesseract
import io
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Example densities for each domain (hardcoded for now)
densities = {
    "Network Security": 0.7,
    "Data Protection": 0.3,
    "Incident Response": 0.2,
    "Compliance": 0.3,
}

# List of questions categorized by topic
questions_data = [
    # Network Security
    {"topic": "Network Security", "question": "Is there a documented network security policy for the organization?"},
    {"topic": "Network Security", "question": "Does the network security policy address the use of firewalls?"},
    {"topic": "Network Security", "question": "Is the use of intrusion detection and prevention systems (IDPS) mandated by the network security policy?"},
    {"topic": "Network Security", "question": "Does the network security policy require the use of encryption for data transmitted over networks?"},

    # Data Protection
    {"topic": "Data Protection", "question": "Is there a documented data protection policy for the organization?"},
    {"topic": "Data Protection", "question": "Does the data protection policy address compliance with relevant regulations (e.g., GDPR, CCPA)?"},
    {"topic": "Data Protection", "question": "Does the data protection policy require measures to ensure data confidentiality, integrity, and availability?"},
    {"topic": "Data Protection", "question": "Does the data protection policy require data classification?"},

    # Incident Response
    {"topic": "Incident Response", "question": "Is there a documented incident response plan for the organization?"},
    {"topic": "Incident Response", "question": "Does the incident response plan define the key phases of the incident response process?"},
    {"topic": "Incident Response", "question": "Does the incident response plan address the identification and containment of security incidents?"},
    {"topic": "Incident Response", "question": "Does the incident response plan require the use of digital forensics?"},

    # Compliance
    {"topic": "Compliance", "question": "Is there a documented compliance policy for the organization?"},
    {"topic": "Compliance", "question": "Does the compliance policy address compliance with relevant cybersecurity frameworks (e.g., NIST, ISO 27001)?"},
    {"topic": "Compliance", "question": "Does the compliance policy address compliance with industry-specific regulations (e.g., HIPAA, PCI DSS)?"},
    {"topic": "Compliance", "question": "Does the compliance policy require regular compliance audits?"}
]

parser_output = None
reranker_model = None
prompter = Prompt()

def parse_file(fp, doc):
    """Executes a parsing job of a newly uploaded file and saves the parser output as text chunks with metadata."""
    parser_output = Parser().parse_one(fp, doc, save_history=False)
    return parser_output

def load_reranker_model():
    """Loads the reranker model used in the RAG process."""
    global reranker_model
    if reranker_model is None:
        reranker_model = ModelCatalog().load_model("jina-reranker-turbo")
    return reranker_model

def load_prompt_model():
    """Loads the core RAG model used for fact-based question-answering."""
    global prompter
    if prompter is None:
        prompter = Prompt().load_model("bling-phi-3-gguf", temperature=0.0, sample=False)
    return prompter

def get_rag_response(prompt, parser_output, reranker_model, prompter):
    """Executes a RAG response."""
    if len(parser_output) > 3:
        output = reranker_model.inference(prompt, parser_output, top_n=10, relevance_threshold=0.25)
    else:
        output = []
        for entries in parser_output:
            entries.update({"rerank_score": 0.0})
            output.append(entries)

    use_top = 3
    if len(output) > use_top:
        output = output[0:use_top]

    sources = prompter.add_source_query_results(output)
    responses = prompter.prompt_with_source(prompt, prompt_name="default_with_context")
    prompter.clear_source_materials()

    return responses[0]['llm_response'] if responses else "No response found."

def generate_follow_up_question(reason):
    """Generates a follow-up question based on the provided reason."""
    prompt = f"Generate a follow-up question based on the fact that: {reason}"
    response = get_rag_response(prompt, [], load_reranker_model(), load_prompt_model())
    return response

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global parser_output
    fp = LLMWareConfig().get_llmware_path()
    doc = file.filename
    file_path = os.path.join(fp, doc)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    parser_output = parse_file(fp, doc)
    return {"message": f"Document Parsed and Ready - {len(parser_output)} chunks"}

class AnswerRequest(BaseModel):
    question: str
    answer: str

@app.post("/answer")
async def process_answer(request: AnswerRequest):
    question = request.question
    answer = request.answer

    if answer.lower() in ["no", "not", "none", "never", "nope", "negative"]:
        reason = f"{question} received a negative response."
        follow_up_question = generate_follow_up_question(reason)
        return {"follow_up_question": follow_up_question}
    else:
        return {"message": "Positive response received"}

@app.get("/questions")
async def get_questions():
    sorted_domains = sorted(densities.items(), key=lambda item: item[1], reverse=True)
    sorted_questions = [q for domain, _ in sorted_domains for q in questions_data if q['topic'] == domain]
    return {"questions": sorted_questions}

class SaveResultsRequest(BaseModel):
    results: Dict[str, str]

@app.post("/save_results")
async def save_results(request: SaveResultsRequest):
    results = request.results
    df = pd.DataFrame(list(results.items()), columns=["Question", "Answer"])
    df.to_csv("questions_answers.csv", index=False)
    return {"message": "Results saved to questions_answers.csv"}


def extract_text_from_image(image_data):
    """Extract text from image using OCR."""
    try:
        image = Image.open(io.BytesIO(image_data))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

@app.post("/summarize")
async def summarize(file: UploadFile = File(...)):
    try:
        # Save uploaded file
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Parse the file
        parser_output = Parser().parse_one(".", file_path)
        
        # Summarize the document
        summary = prompter.summarize_document_fc(".", file_path, text_only=True)

        # Clean up
        os.remove(file_path)

        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
# Load the SecureBERT model and tokenizer
tokenizer = RobertaTokenizerFast.from_pretrained("ehsanaghaei/SecureBERT")
model = transformers.RobertaForMaskedLM.from_pretrained("ehsanaghaei/SecureBERT")

# Predefined security terms for masking
security_terms_corpus = ["firewall", "malware", "intrusion", "encryption", "phishing", "DDoS"]  # Sample terms

def extract_text_from_pdf(pdf_file_path):
    """Extract text from a PDF file."""
    pdf_reader = PyPDF2.PdfReader(pdf_file_path)
    extracted_text = ""
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        extracted_text += page.extract_text()
    return extracted_text

def create_text_chunks(text, chunk_size=512):
    """Split text into smaller chunks."""
    chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
    return chunks

def create_mask(chunks, security_terms_corpus):
    """Replace security terms in chunks with <mask>."""
    masked_chunks = []
    for chunk in chunks:
        input_words = chunk.split()
        for i in range(len(input_words)):
            if input_words[i].lower() in security_terms_corpus:
                input_words[i] = '<mask>'
        masked_chunks.append(' '.join(input_words))
    return masked_chunks

def create_chunks(text, max_length=510):
    """Create tokenized chunks of text."""
    tokens = tokenizer.encode(text, add_special_tokens=True)
    chunks = [tokens[i:i + max_length] for i in range(0, len(tokens), max_length)]
    decoded_chunks = [tokenizer.decode(chunk, skip_special_tokens=False) for chunk in chunks]
    return decoded_chunks

def predict_mask(sent, tokenizer, model, topk=10):
    """Predict words for <mask> tokens in a sentence."""
    token_ids = tokenizer.encode(sent, return_tensors='pt', add_special_tokens=True)
    masked_position = (token_ids.squeeze() == tokenizer.mask_token_id).nonzero()
    masked_pos = [mask.item() for mask in masked_position]
    words = []

    with torch.no_grad():
        output = model(token_ids)

    last_hidden_state = output[0].squeeze()

    list_of_list = []
    for mask_index in masked_pos:
        mask_hidden_state = last_hidden_state[mask_index]
        idx = torch.topk(mask_hidden_state, k=topk, dim=0)[1]
        words = [tokenizer.decode(i.item()).strip() for i in idx]
        words = [w.replace(' ', '') for w in words]
        list_of_list.append(words)

    return list_of_list

def generate_vulnerabilities(predictions, security_terms_corpus):
    """Generate a list of vulnerabilities."""
    vulnerabilities = []
    for sublist in predictions:
        for item in sublist:
            if item not in security_terms_corpus:
                vulnerabilities.append(item)
    return vulnerabilities

@app.post("/vulnerabilities/")
async def extract_vulnerabilities(pdf: UploadFile = File(...)):
    """API endpoint to extract vulnerabilities from a PDF."""
    # Save the uploaded PDF file
    pdf_path = f"temp_{pdf.filename}"
    with open(pdf_path, "wb") as f:
        f.write(await pdf.read())
    
    # Extract text from the PDF
    doc_text = extract_text_from_pdf(pdf_path)
    
    # Remove the temp file
    os.remove(pdf_path)
    
    # Create text chunks and mask terms
    chunks = create_text_chunks(doc_text, chunk_size=512)
    masked_chunks = create_mask(chunks, security_terms_corpus)
    
    # Perform mask prediction
    predictions = []
    for chunk in masked_chunks:
        tokenized_chunks = create_chunks(chunk)
        for tokenized_chunk in tokenized_chunks:
            predicted_words = predict_mask(tokenized_chunk, tokenizer, model, topk=10)
            predictions.extend(predicted_words)
    
    # Generate vulnerabilities based on predictions
    vulnerabilities = generate_vulnerabilities(predictions, security_terms_corpus)
    
    # Return the vulnerabilities as a JSON response
    return JSONResponse(content={"vulnerabilities": vulnerabilities})

# Run the app using Uvicorn
# Command: uvicorn main:app --reload
# Run the app using Uvicorn
# Command: uvicorn main:app --reload

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)