import 'dart:typed_data';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;
import 'package:medicoscope/data/disease_database.dart';
import 'package:medicoscope/models/detection_result.dart';

class TFLiteMobileService {
  Interpreter? _interpreter;
  String? _currentCategory;

  int inputSize = 416;

  Future<void> loadModel(String category) async {
    try {
      _interpreter?.close();

      final modelPath = DiseaseDatabase.getModelPath(category);
      _interpreter = await Interpreter.fromAsset(modelPath);
      _currentCategory = category;

      var inputTensor = _interpreter!.getInputTensor(0);
      var inputShape = inputTensor.shape;

      if (inputShape.length >= 3) {
        inputSize = inputShape[1] == 3 ? inputShape[2] : inputShape[1];
        print('Updated input size to: $inputSize');
      }

      print('Model loaded successfully for category: $category');
    } catch (e) {
      print('Error loading model: $e');
      rethrow;
    }
  }

  Future<DetectionResult?> runInferenceFromBytes(Uint8List imageBytes) async {
    if (_interpreter == null || _currentCategory == null) {
      throw Exception('Model not loaded. Call loadModel() first.');
    }

    try {
      img.Image? image = img.decodeImage(imageBytes);

      if (image == null) {
        throw Exception('Failed to decode image');
      }

      img.Image resizedImage = img.copyResize(
        image,
        width: inputSize,
        height: inputSize,
      );

      var inputTensor = _interpreter!.getInputTensor(0);
      var inputShape = inputTensor.shape;

      print('Model input shape: $inputShape');
      print('Model input type: ${inputTensor.type}');

      var input = _imageToByteListFloat32(resizedImage, inputShape);

      bool isClassification =
          DiseaseDatabase.isClassificationModel(_currentCategory!);

      var outputTensor = _interpreter!.getOutputTensor(0);
      var outputShape = outputTensor.shape;

      print('Model output shape: $outputShape');
      print('Model output type: ${outputTensor.type}');

      if (isClassification) {
        int outputSize = outputShape.reduce((a, b) => a * b);
        var output = List.filled(outputSize, 0.0).reshape(outputShape);

        print('Running classification inference with output size: $outputSize');

        _interpreter!.run(input, output);

        return _processClassificationOutput(output);
      } else {
        int outputSize = outputShape.reduce((a, b) => a * b);
        var output = List.filled(outputSize, 0.0).reshape(outputShape);

        print(
            'Running object detection inference with output shape: $outputShape');

        _interpreter!.run(input, output);

        return _processOutput(output);
      }
    } catch (e) {
      print('Error during inference: $e');
      rethrow;
    }
  }

  Uint8List _imageToByteListFloat32(img.Image image, List<int> inputShape) {
    bool isNCHW = inputShape.length == 4 && inputShape[1] == 3;

    var convertedBytes = Float32List(1 * inputSize * inputSize * 3);
    var buffer = Float32List.view(convertedBytes.buffer);

    if (isNCHW) {
      print('Using NCHW input format');
      int channelSize = inputSize * inputSize;

      for (var i = 0; i < inputSize; i++) {
        for (var j = 0; j < inputSize; j++) {
          var pixel = image.getPixel(j, i);
          int pixelIndex = i * inputSize + j;

          buffer[pixelIndex] = pixel.r / 255.0;
          buffer[channelSize + pixelIndex] = pixel.g / 255.0;
          buffer[2 * channelSize + pixelIndex] = pixel.b / 255.0;
        }
      }
    } else {
      print('Using NHWC input format');
      int pixelIndex = 0;

      for (var i = 0; i < inputSize; i++) {
        for (var j = 0; j < inputSize; j++) {
          var pixel = image.getPixel(j, i);

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

    final labels = DiseaseDatabase.getLabels(_currentCategory!);

    bool isTransposed = false;
    int numDetections = 0;
    int numClasses = labels.length;

    if (output[0].length < 100) {
      isTransposed = true;
      numDetections = output[0][0].length;
      print('Detected transposed output format');
    } else {
      numDetections = output[0].length;
      print('Detected standard output format');
    }

    double maxConfidence = 0.0;
    int maxClassIndex = 0;
    List<double> bestBbox = [0, 0, 0, 0];

    List<Map<String, dynamic>> topDetections = [];

    for (int i = 0; i < numDetections; i++) {
      double objectness;
      List<double> classProbs = [];
      int detectedClassIndex = 0;

      if (isTransposed) {
        objectness = output[0][4][i];

        for (int j = 5; j < output[0].length && (j - 5) < numClasses; j++) {
          classProbs.add(output[0][j][i]);
        }
      } else {
        var detection = output[0][i];

        if (detection.length == 6) {
          objectness = detection[4];
          detectedClassIndex = detection[5].round();

          if (i < 3) {
            print('Detection $i: confidence=${objectness.toStringAsFixed(6)}, '
                'class_id=$detectedClassIndex, bbox=[${detection[0].toStringAsFixed(2)}, ${detection[1].toStringAsFixed(2)}, ${detection[2].toStringAsFixed(2)}, ${detection[3].toStringAsFixed(2)}]');
          }

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
          continue;
        }

        objectness = detection[4];

        for (int j = 5; j < detection.length && (j - 5) < numClasses; j++) {
          classProbs.add(detection[j]);
        }
      }

      if (i < 3 && classProbs.isNotEmpty) {
        print('Detection $i: objectness=${objectness.toStringAsFixed(6)}, '
            'classProbs=[${classProbs.map((p) => p.toStringAsFixed(6)).join(", ")}]');
      }

      double maxClassProb = 0.0;
      int classIndex = 0;

      for (int j = 0; j < classProbs.length; j++) {
        if (classProbs[j] > maxClassProb) {
          maxClassProb = classProbs[j];
          classIndex = j;
        }
      }

      double confidence = objectness * maxClassProb;

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

    topDetections.sort((a, b) => b['confidence'].compareTo(a['confidence']));
    print('Top 5 detections:');
    for (int i = 0; i < topDetections.length && i < 5; i++) {
      var det = topDetections[i];
      print(
          '  ${i + 1}. ${det['class']}: ${(det['confidence'] * 100).toStringAsFixed(4)}% '
          '(obj: ${(det['objectness'] * 100).toStringAsFixed(4)}%, '
          'cls: ${(det['classProb'] * 100).toStringAsFixed(4)}%)');
    }

    if (maxConfidence < 0.0001) {
      print(
          'Max confidence ${(maxConfidence * 100).toStringAsFixed(6)}% below threshold');
      return null;
    }

    final className = labels[maxClassIndex];
    final diseaseInfo = DiseaseDatabase.getDiseaseInfo(className);

    if (diseaseInfo == null) {
      return null;
    }

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

    final labels = DiseaseDatabase.getLabels(_currentCategory!);

    double maxConfidence = 0.0;
    int maxClassIndex = 0;

    for (int i = 0; i < output[0].length; i++) {
      double confidence = output[0][i];
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        maxClassIndex = i;
      }
    }

    if (maxConfidence < 0.5) {
      return null;
    }

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
