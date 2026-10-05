"""
PROJECT: CHLOE - Clinical Helper for Locomotion Objective Evaluation
AUTHOR: Belén Gómez Martínez
THESIS: Bachelor's Thesis (TFG) - [Grado en Ingeniería Biomédica, ETSIT, UPM]
DESCRIPTION: Flask-based REST API orchestrating C3D file ingestion, temporal storage, and synchronization between biomechanical processing and the web interface.
REFERENCES: Chapter 3 (Requirements), Chapter 4 (Design & Implementation)
"""

from flask import Flask, request, jsonify, send_from_directory
import tempfile
import os
from processor import process_c3d_file

app = Flask(__name__, static_folder='dist', 
            static_url_path='') # Serve static files from the 'dist' directory (built frontend)


# ======================================================================
# FLASK ENDPOINTS
# ======================================================================

@app.route('/c3d_file_list', methods=['GET'])
def handle_c3d_files():
    filelist = os.listdir('/server/datos_c3d')
    if not filelist:
        return jsonify({'error': 'No files found'}), 404
    filelistc3d = list()
    for file in filelist:
        if file.endswith('.c3d'):
            filelistc3d.append(file)
    return jsonify({'files': filelistc3d})

@app.route('/process_c3d', methods=['POST'])
def select_file():
    data = request.get_json()
    filename = data.get('filename')

    if not filename:
        return jsonify({'error': 'No filename provided'}), 400

    c3d_file_path = os.path.join('/server/datos_c3d', filename)

    if not os.path.exists(c3d_file_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        result = process_c3d_file(c3d_file_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve_index(): return send_from_directory(app.static_folder, 'index.html')
