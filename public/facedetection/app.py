import threading  # Add this line
from flask import Flask, jsonify, request
from flask_cors import CORS
from keras.models import load_model
from PIL import Image, ImageOps
import numpy as np
import base64
from io import BytesIO
import cv2  # Ensure you have OpenCV imported

# Initialize the Flask application
app = Flask(__name__)
CORS(app)
# Load the model (make sure the model is in the correct path)
model = load_model("./model/keras_Model.h5", compile=False)

# Load the labels
with open("./model/labels.txt", "r") as f:
    class_names = f.readlines()

# Define a function to preprocess the image
def preprocess_image(image):
    # Resize and crop the image to 224x224
    size = (224, 224)
    image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
    
    # Convert the image to a numpy array and normalize it
    image_array = np.asarray(image)
    normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
    
    # Create a numpy array of the right shape (1, 224, 224, 3)
    data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
    data[0] = normalized_image_array
    
    return data

def capture_frame_from_webcam():
    # Start the webcam capture
    cap = cv2.VideoCapture(0)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert the frame to a PIL Image
        image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        # Preprocess the image
        data = preprocess_image(image)
        
        # Predict the class
        prediction = model.predict(data)
        index = np.argmax(prediction)
        class_name = class_names[index].strip()
        confidence_score = prediction[0][index]
        
        # Display the prediction on the frame
        label = f"{class_name} ({confidence_score*100:.2f}%)"
        cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv2.LINE_AA)
        
        # Show the frame with the label
        cv2.imshow("Real-Time Prediction", frame)
        
        # Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

@app.route("/detect", methods=["POST"])
def detect():
    try:
        data = request.get_json()
        image_data = data["image"]

        # Decode base64 image
        header, encoded = image_data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        image = Image.open(BytesIO(img_bytes))

        # Preprocess
        data = preprocess_image(image)

        # Predict
        prediction = model.predict(data)
        index = np.argmax(prediction)
        class_name = class_names[index].strip()
        confidence_score = float(prediction[0][index])

        return jsonify({
            "class": class_name,
            "confidence": f"{confidence_score * 100:.2f}%"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict", methods=["GET"])
def predict():
    return jsonify({"status": "The system is running and continuously processing webcam frames."})

if __name__ == "__main__":
    # Start the webcam capture in a separate thread
    webcam_thread = threading.Thread(target=capture_frame_from_webcam)
    webcam_thread.daemon = True
    webcam_thread.start()

    # Run the Flask app
    app.run(debug=True, threaded=True)
