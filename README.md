# AI-Multi-Document-Summarizer

An advanced AI-powered text summarization web application built with Flask and Google's Gemini models. This application allows users to upload various document types (PDFs, PPTXs, TXT files) or provide URLs (including YouTube videos) to generate high-quality summaries in multiple formats. Supports features like flowcharts, mindmaps, Q&A chat, and text-to-speech.

## Features

- **Multi-Format Support:** Upload text files, PDFs, or PowerPoint presentations.
- **URL & YouTube Summarization:** Extract and summarize text from web pages or YouTube video transcripts.
- **Multiple Output Modes:** 
  - Paragraphs
  - Bullet points
  - Flowcharts (using Mermaid.js)
  - Smart Flowcharts (hierarchical)
  - Mindmaps
- **Multimodal AI:** Extracts and incorporates contextual images from PDFs and PPTXs into the summary.
- **Text-to-Speech:** Listen to the generated summaries using high-quality AI voices.
- **Document Chat:** Ask specific questions about your uploaded documents or URLs.
- **User Accounts & History:** Register an account to save your generated summaries and revisit them later.

## Technologies Used

- **Backend:** Python, Flask, SQLAlchemy (SQLite)
- **AI Models:** Google Gemini API (2.5 Flash, 2.0 Flash, etc.)
- **Text Extraction:** PyMuPDF (fitz), PyPDF2, python-pptx, BeautifulSoup, youtube-transcript-api
- **Audio Generation:** edge-tts
- **Frontend:** HTML, CSS, JavaScript

## Prerequisites

- Python 3.8+
- Google Gemini API Key

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd text_summarization
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and add your Google API Key:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   FLASK_SECRET_KEY=your_secret_key_here
   ```

## Running the Application

Start the Flask application by running:
```bash
python app.py
```
The application will be accessible at `http://127.0.0.1:5000/`.

## Usage

1. **Register/Login:** Create an account to access the summarization tools.
2. **Upload/Link:** Choose files from your computer, or paste a URL / YouTube link.
3. **Select Mode:** Choose between standard summary, bullet points, flowchart, or mindmap.
4. **Select Length:** Choose how detailed you want the summary to be.
5. **Summarize:** Click the summarize button and wait for the AI to process your document.
6. **Chat & Audio:** Use the Chat tab to ask questions, or the play button to hear the summary aloud.

## Sample input and output
**Input** :
<img width="1919" height="916" alt="Screenshot 2026-04-18 142356" src="https://github.com/user-attachments/assets/07aeab0d-235f-44c7-b4ec-42fa9ed983f3" />

**Output** :
<img width="1515" height="887" alt="Screenshot 2026-04-18 142633" src="https://github.com/user-attachments/assets/8c8ddb99-4f62-416b-b9b3-bb647feb3951" />


## License

This project is licensed under the MIT License.
