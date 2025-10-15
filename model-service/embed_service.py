from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2, preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import io
import base64

app = Flask(__name__)
CORS(app)

# Load MobileNetV2 model (only once at startup)
model = MobileNetV2(weights="imagenet", include_top=False, pooling="avg")

def get_embedding_from_base64(image_base64):
    """Convert base64 image to embedding vector."""
    try:
        # Handle both base64 strings with/without prefix
        image_data = image_base64.split(",")[-1]
        image_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))

        # Convert to array and preprocess
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        # Generate embedding
        embedding = model.predict(img_array, verbose=0)
        return embedding.flatten().tolist()

    except Exception as e:
        raise ValueError(f"Image processing failed: {str(e)}")

@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Backend is running!"})

@app.route("/api/embed", methods=["POST"])
def embed():
    """Receive base64 image and return its embedding."""
    try:
        data = request.get_json()
        if not data or "imageBase64" not in data:
            return jsonify({"error": "Missing 'imageBase64' in request"}), 400

        embedding = get_embedding_from_base64(data["imageBase64"])
        return jsonify({"embedding": embedding})

    except Exception as e:
        print("❌ Backend Error:", str(e))
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # For local testing
    app.run(host="0.0.0.0", port=5001)










# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import tensorflow as tf
# from tensorflow.keras.applications import MobileNetV2
# from tensorflow.keras.models import Model
# from tensorflow.keras.preprocessing import image
# import numpy as np
# from PIL import Image
# import io
# import base64

# app = Flask(__name__)
# CORS(app)


# base_model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')
# model = Model(inputs=base_model.input, outputs=base_model.output)

# def get_embedding_from_base64(image_base64):
#     image_bytes = base64.b64decode(image_base64.split(",")[-1])
#     img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
#     img_array = image.img_to_array(img)
#     img_array = np.expand_dims(img_array, axis=0)
#     img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
#     embedding = model.predict(img_array, verbose=0)
#     return embedding.flatten().tolist()  

# @app.route("/embed", methods=["POST"])
# def embed():
#     data = request.get_json()
#     if "imageBase64" not in data:
#         return jsonify({"error": "No image data provided"}), 400
#     embedding = get_embedding_from_base64(data["imageBase64"])
#     return jsonify({"embedding": embedding})

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5001)
