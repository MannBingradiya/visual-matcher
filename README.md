Visual Product Matcher

The Visual Product Matcher implements a modern, decoupled microservice architecture using a Node.js/Express API to orchestrate search requests between the React frontend and a dedicated Python/Flask ML service. This separation ensures system stability and clean code. The core intelligence relies on transferring Base64 image data to the Python service, which uses a pre-trained MobileNetV2 model to generate a 1280-dimension feature vector. The Node.js layer receives this vector and performs a high-speed Cosine Similarity calculation against the 1650 product database. Results are ranked for accuracy and filtered for optimal user experience, demonstrating proficiency in full-stack development and applied computer vision integration.

Core Logic: Vector Similarity

        Input: Client sends Base64 image data to the Node.js API.

        Embedding: The Node.js API forwards the Base64 string to the Python ML Service. The service uses a pre-trained MobileNetV2 model to generate a 1280-dimension vector embedding.

        Matching: The Node.js API performs a highly efficient Cosine Similarity calculation between the search vector and all 1650 product vectors in the database.

        Output: Results are ranked by similarity score (highest score = best match) and returned to the React frontend.

You must run the Python service first, then the Node.js API, and finally the React frontend.

1. Clone Repository and Initial Setup

        # Clone the repository
        git clone [https://github.com/MannBingradiya/visual-matcher.git](https://github.com/MannBingradiya/visual-matcher.git)
        cd visual-matcher


2. Python ML Service (Terminal 1)

Navigate and create environment:

        cd model-service
        python -m venv venv
        .\venv\Scripts\activate # Windows
        # source venv/bin/activate # Linux/macOS


Install requirements (will include Flask, PyTorch, etc.):

        pip install -r requirements.txt


Start the service (Must be running first):

        python embed_service.py


(Service runs on http://0.0.0.0:5001)

3. Node.js Express API (Terminal 2)

Navigate:

        cd backend
        npm install


Start the API:

        node server.js


(API runs on http://localhost:5000)

4. React Frontend (Terminal 3)

Navigate (adjust path for your local structure):

        cd frontend/visual-image-frontend 
        npm install


Start the Frontend:

npm start


(App opens on http://localhost:3000)
