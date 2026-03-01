# DORA THE FILE FINDER
This project is our solution for the Merlin Software's challenge at HackUDC2026, a platform that gives you smart search of files you upload to it via LLM chatbot. 

It works on a Next.js client where the user can upload a file to the SQLite database or input a query to retrieve files relevant to it.

## Installation
### Requirements
*npm
*pip
*Gemini API key (get it [here](https://aistudio.google.com/app/api-keys))

### Installation Steps
1. Clone the repo:
```sh
mkdir -p git && cd git/ && git clone https://github.com/fragi0/Dora-the-File-Finder.git && cd Dora-the-File-Finder/
```
2. Start the server
    1. Start a python venv
        ```sh
        python3 -m venv .venv
        ```
    2.  Install pip requirements
        ```sh
        pip install -r requirements.txt
        ```
    3. Set your Gemini API key
        ```sh
        export GEMINI_API_KEY="your_api_key"
        ```
    4. Run the server
        ```sh
        fastapi dev src/api/fsapi.py
        ```

3. Start the client
     1. Install npm requirements
        ```sh
        cd src/gui/ && npm install
        ```
     2. Run the client
        ```sh
        npm run dev
        ```

4. Enjoy
