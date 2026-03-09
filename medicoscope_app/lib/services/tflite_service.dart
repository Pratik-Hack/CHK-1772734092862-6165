import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;
import 'package:medicoscope/data/disease_database.dart';
import 'package:medicoscope/models/detection_result.dart';

class TFLiteService {
  Interpreter? _interpreter;
  String? _currentCategory;

  // YOLOv8 input size (will be updated from model)
  int inputSize = 416;

  Future<void> loadModel(String category) async {
    try {
      // Close previous interpreter if exists
      _interpreter?.close();

      // Get model path
      final modelPath = DiseaseDatabase.getModelPath(category);

      // Load model
      _interpreter = await Interpreter.fromAsset(modelPath);
      _currentCategory = category;

      // Get actual input size from model
      var inputTensor = _interpreter!.getInputTensor(0);
      var inputShape = inputTensor.shape;

      // Update input size based on model (assuming square input)
      if (inputShape.length >= 3) {
        // For NHWC: [1, height, width, 3] or NCHW: [1, 3, height, width]
        inputSize = inputShape[1] == 3 ? inputShape[2] : inputShape[1];
        print('Updated input size to: $inputSize');
      }

      print('Model loaded successfully for category: $category');
    } catch (e) {
      print('Error loading model: $e');
      rethrow;
    }
  }

  Future<DetectionResult?> runInference(File imageFile) async {
    if (_interpreter == null || _currentCategory == null) {
      throw Exception('Model not loaded. Call loadModel() first.');
    }

    try {
      // Read and decode image
      final imageBytes = await imageFile.readAsBytes();
      img.Image? image = img.decodeImage(imageBytes);

      if (image == null) {
        throw Exception('Failed to decode image');
      }

      // Resize image to model input size
      img.Image resizedImage = img.copyResize(
        image,
        width: inputSize,
        height: inputSize,
      );

      // Get input tensor shape from the model
      var inputTensor = _interpreter!.getInputTensor(0);
      var inputShape = inputTensor.shape;

      print('Model input shape: $inputShape');
      print('Model input type: ${inputTensor.type}');

      // Convert to input tensor with correct shape
      var input = _imageToByteListFloat32(resizedImage, inputShape);

      // Check if this is a classification model (eye) or object detection
      bool isClassification =
          DiseaseDatabase.isClassificationModel(_currentCategory!);

      // Get output tensor shape from the model
      var outputTensor = _interpreter!.getOutputTensor(0);
      var outputShape = outputTensor.shape;

      print('Model output shape: $outputShape');
      print('Model output type: ${outputTensor.type}');

      if (isClassification) {
        // Classification model (eye)
        // Expected output shape: [1, num_classes]
        // Use actual output shape from model
        int outputSize = outputShape.reduce((a, b) => a * b);
        var output = List.filled(outputSize, 0.0).reshape(outputShape);

        print('Running classification inference with output size: $outputSize');

        // Run inference
        _interpreter!.run(input, output);

        // Process classification output
        return _processClassificationOutput(output);
      } else {
        // Object detection model (skin, chest, brain)
        // Use actual output shape from model instead of hardcoded values
        int outputSize = outputShape.reduce((a, b) => a * b);
        var output = List.filled(outputSize, 0.0).reshape(outputShape);

        print(
            'Running object detection inference with output shape: $outputShape');

        // Run inference
        _interpreter!.run(input, output);

        // Process object detection output
        return _processOutput(output);
      }
    } catch (e) {
      print('Error during inference: $e');
      rethrow;
    }
  }

  Uint8List _imageToByteListFloat32(img.Image image, List<int> inputShape) {
    // Determine if input is NCHW [1, 3, 640, 640] or NHWC [1, 640, 640, 3]
    bool isNCHW = inputShape.length == 4 && inputShape[1] == 3;

    var convertedBytes = Float32List(1 * inputSize * inputSize * 3);
    var buffer = Float32List.view(convertedBytes.buffer);

    if (isNCHW) {
      // NCHW format: [1, 3, 640, 640]
      // Channels are separate: all R, then all G, then all B
      print('Using NCHW input format');
      int channelSize = inputSize * inputSize;

      for (var i = 0; i < inputSize; i++) {
        for (var j = 0; j < inputSize; j++) {
          var pixel = image.getPixel(j, i);
          int pixelIndex = i * inputSize + j;

          // Normalize to [0, 1]
          buffer[pixelIndex] = pixel.r / 255.0; // R channel
          buffer[channelSize + pixelIndex] = pixel.g / 255.0; // G channel
          buffer[2 * channelSize + pixelIndex] = pixel.b / 255.0; // B channel
        }
      }
    } else {
      // NHWC format: [1, 640, 640, 3]
      // Channels are interleaved: RGB, RGB, RGB...
      print('Using NHWC input format');
      int pixelIndex = 0;

      for (var i = 0; i < inputSize; i++) {
        for (var j = 0; j < inputSize; j++) {
          var pixel = image.getPixel(j, i);

          // Normalize to [0, 1]
          buffer[pixelIndex++] = pixel.r / 255.0;
          buffer[pixelIndex++] = pixel.g / 255.0;
          buffer[pixelIndex++] = pixel.b / 255.0;
        }
      }
    }

    return convertedBytes.buffer.asUint8List();
  }

  DetectionResult? _processOutput(List output) {
    if (_currentCategory == null) return null;

    // Get labels for current category
    final labels = DiseaseDatabase.getLabels(_currentCategory!);

    // Handle different YOLOv8 output formats
    // Format 1: [1, num_detections, num_classes + 5] - standard
    // Format 2: [1, num_classes + 5, num_detections] - transposed

    bool isTransposed = false;
    int numDetections = 0;
    int numClasses = labels.length;

    // Check if output is transposed (like [1, 12, 3549])
    if (output[0].length < 100) {
      // Likely transposed: [1, num_classes + 5, num_detections]
      isTransposed = true;
      numDetections = output[0][0].length;
      print('Detected transposed output format');
    } else {
      // Standard format: [1, num_detections, num_classes + 5]
      numDetections = output[0].length;
      print('Detected standard output format');
    }

    // Process detections
    double maxConfidence = 0.0;
    int maxClassIndex = 0;
    List<double> bestBbox = [0, 0, 0, 0]; // [cx, cy, w, h] in pixel coords

    // Track top detections for debugging
    List<Map<String, dynamic>> topDetections = [];

    for (int i = 0; i < numDetections; i++) {
      double objectness;
      List<double> classProbs = [];
      int detectedClassIndex = 0;

      if (isTransposed) {
        // Transposed format: [1, features, detections]
        // Index 4 is objectness, 5+ are class probabilities
        objectness = output[0][4][i];

        for (int j = 5; j < output[0].length && (j - 5) < numClasses; j++) {
          classProbs.add(output[0][j][i]);
        }
      } else {
        // Standard format: [1, detections, features]
        var detection = output[0][i];

        // Check if this is the new format: [x, y, w, h, confidence, class_id]
        if (detection.length == 6) {
          // New SSD/TFLite format
          objectness = detection[4]; // confidence
          detectedClassIndex = detection[5].round(); // class_id

          // Debug: Show first 3 detections
          if (i < 3) {
            print('Detection $i: confidence=${objectness.toStringAsFixed(6)}, '
                'class_id=$detectedClassIndex, bbox=[${detection[0].toStringAsFixed(2)}, ${detection[1].toStringAsFixed(2)}, ${detection[2].toStringAsFixed(2)}, ${detection[3].toStringAsFixed(2)}]');
          }

          // For this format, we use confidence directly
          if (objectness > 0.1 && detectedClassIndex < labels.length) {
            topDetections.add({
              'class': labels[detectedClassIndex],
              'confidence': objectness,
              'objectness': objectness,
              'classProb': 1.0,
            });

            if (objectness > maxConfidence) {
              maxConfidence = objectness;
              maxClassIndex = detectedClassIndex;
              bestBbox = [
                detection[0].toDouble(),
                detection[1].toDouble(),
                detection[2].toDouble(),
                detection[3].toDouble(),
              ];
            }
          }
          continue; // Skip the old processing logic
        }

        // Old YOLO format
        objectness = detection[4];

        for (int j = 5; j < detection.length && (j - 5) < numClasses; j++) {
          classProbs.add(detection[j]);
        }
      }

      // Old YOLO format processing
      // Debug: Show first 3 detections
      if (i < 3 && classProbs.isNotEmpty) {
        print('Detection $i: objectness=${objectness.toStringAsFixed(6)}, '
            'classProbs=[${classProbs.map((p) => p.toStringAsFixed(6)).join(", ")}]');
      }

      // Find class with highest probability
      double maxClassProb = 0.0;
      int classIndex = 0;

      for (int j = 0; j < classProbs.length; j++) {
        if (classProbs[j] > maxClassProb) {
          maxClassProb = classProbs[j];
          classIndex = j;
        }
      }

      double confidence = objectness * maxClassProb;

      // Track for debugging
      if (confidence > 0.000001 && classIndex < labels.length) {
        topDetections.add({
          'class': labels[classIndex],
          'confidence': confidence,
          'objectness': objectness,
          'classProb': maxClassProb,
        });
      }

      if (confidence > maxConfidence && classIndex < labels.length) {
        maxConfidence = confidence;
        maxClassIndex = classIndex;
        if (isTransposed) {
          bestBbox = [
            output[0][0][i].toDouble(),
            output[0][1][i].toDouble(),
            output[0][2][i].toDouble(),
            output[0][3][i].toDouble(),
          ];
        } else {
          var det = output[0][i];
          bestBbox = [
            det[0].toDouble(),
            det[1].toDouble(),
            det[2].toDouble(),
            det[3].toDouble(),
          ];
        }
      }
    }

    // Sort and show top 5 detections
    topDetections.sort((a, b) => b['confidence'].compareTo(a['confidence']));
    print('Top 5 detections:');
    for (int i = 0; i < topDetections.length && i < 5; i++) {
      var det = topDetections[i];
      print(
          '  ${i + 1}. ${det['class']}: ${(det['confidence'] * 100).toStringAsFixed(4)}% '
          '(obj: ${(det['objectness'] * 100).toStringAsFixed(4)}%, '
          'cls: ${(det['classProb'] * 100).toStringAsFixed(4)}%)');
    }

    // Very low threshold to work with model's output range
    if (maxConfidence < 0.0001) {
      // 0.01%
      print(
          'Max confidence ${(maxConfidence * 100).toStringAsFixed(6)}% below threshold');
      return null;
    }

    // Get disease info
    final className = labels[maxClassIndex];
    final diseaseInfo = DiseaseDatabase.getDiseaseInfo(className);

    if (diseaseInfo == null) {
      return null;
    }

    // Normalize bbox to 0-1 range for chest and brain categories
    double? normBboxX, normBboxY, normBboxW, normBboxH;
    if (_currentCategory == 'chest' || _currentCategory == 'brain') {
      normBboxX = (bestBbox[0] / inputSize).clamp(0.0, 1.0);
      normBboxY = (bestBbox[1] / inputSize).clamp(0.0, 1.0);
      normBboxW = (bestBbox[2] / inputSize).clamp(0.0, 1.0);
      normBboxH = (bestBbox[3] / inputSize).clamp(0.0, 1.0);
    }

    return DetectionResult(
      className: className,
      confidence: maxConfidence,
      description: diseaseInfo['description'] ?? '',
      model3dPath: diseaseInfo['model3d'] ?? '',
      category: _currentCategory!,
      bboxX: normBboxX,
      bboxY: normBboxY,
      bboxWidth: normBboxW,
      bboxHeight: normBboxH,
    );
  }

  DetectionResult? _processClassificationOutput(List output) {
    if (_currentCategory == null) return null;

    // Get labels for current category
    final labels = DiseaseDatabase.getLabels(_currentCategory!);

    // Find class with highest confidence
    double maxConfidence = 0.0;
    int maxClassIndex = 0;

    for (int i = 0; i < output[0].length; i++) {
      double confidence = output[0][i];
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        maxClassIndex = i;
      }
    }

    // Confidence threshold for classification
    if (maxConfidence < 0.5) {
      return null;
    }

    // Get disease info
    if (maxClassIndex >= labels.length) {
      return null;
    }

    final className = labels[maxClassIndex];
    final diseaseInfo = DiseaseDatabase.getDiseaseInfo(className);

    if (diseaseInfo == null) {
      return null;
    }

    return DetectionResult(
      className: className,
      confidence: maxConfidence,
      description: diseaseInfo['description'] ?? '',
      model3dPath: diseaseInfo['model3d'] ?? '',
      category: _currentCategory!,
    );
  }

  void dispose() {
    _interpreter?.close();
    _interpreter = null;
    _currentCategory = null;
  }
}
