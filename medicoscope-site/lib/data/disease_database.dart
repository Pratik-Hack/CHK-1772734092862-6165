class DiseaseDatabase {
  static const Map<String, Map<String, dynamic>> diseases = {
    // Skin/Dermascopy Diseases
    'Actinic Keratoses and Intraepithelial Carcinoma': {
      'category': 'skin',
      'description':
          'A precancerous skin condition with rough, scaly patches on sun-exposed areas. Appears as dry, rough patches that feel like sandpaper, typically pink, red, or brown in color. Can progress to skin cancer if untreated.',
      'model3d': 'assets/3d_models/actinic-keratoses.glb',
    },
    'Basal Cell Carcinoma': {
      'category': 'skin',
      'description':
          'The most common type of skin cancer, appearing as a pearly or waxy bump, often with visible blood vessels. May also present as a flat, flesh-colored or brown scar-like lesion. Grows slowly and rarely spreads.',
      'model3d': 'assets/3d_models/basal-cell-carcinoma.glb',
    },
    'Benign Keratosis-like Lesions': {
      'category': 'skin',
      'description':
          'Non-cancerous skin growths with a "pasted-on" appearance. Usually brown, black, or tan with a waxy, scaly, or rough texture. Common in older adults and generally harmless.',
      'model3d': 'assets/3d_models/seborrheic-keratosis-benign.glb',
    },
    'Dermatofibroma': {
      'category': 'skin',
      'description':
          'A harmless, firm bump under the skin, typically pink or brown in color. Often appears on the legs and may dimple inward when pinched. Usually painless but can be tender.',
      'model3d': 'assets/3d_models/dermatofibroma.glb',
    },
    'Melanocytic Nevi': {
      'category': 'skin',
      'description':
          'Common moles that are typically brown, round, and uniform in color. Most are benign and appear during childhood. Monitor for changes using the ABCDE rule (Asymmetry, Border, Color, Diameter, Evolution).',
      'model3d': 'assets/3d_models/melanocytic-nevi.glb',
    },
    'Melanoma': {
      'category': 'skin',
      'description':
          'A serious form of skin cancer originating from melanocytes. Characterized by asymmetric shape, irregular borders, multiple colors, large diameter, and evolving appearance. Early detection is crucial for successful treatment.',
      'model3d': 'assets/3d_models/melanoma.glb',
    },
    'Vascular Lesions': {
      'category': 'skin',
      'description':
          'Abnormal blood vessel growths appearing as red, purple, or blue marks on the skin. Can include hemangiomas and other vascular malformations. Most are benign and may fade over time.',
      'model3d': 'assets/3d_models/vascular-lesions.glb',
    },

    // Chest X-Ray Conditions
    'Atelectasis': {
      'category': 'chest',
      'description':
          'Partial or complete lung collapse where air sacs deflate. Appears as increased density on X-ray with volume loss. May cause shortness of breath, coughing, and chest pain.',
      'model3d': 'assets/3d_models/heart.glb',
    },
    'Cardiomegaly': {
      'category': 'chest',
      'description':
          'Enlarged heart often indicating underlying cardiovascular conditions. May cause shortness of breath, irregular heartbeat, and swelling in legs. Requires medical evaluation to determine the cause.',
      'model3d': 'assets/3d_models/heart.glb',
    },
    'Effusion': {
      'category': 'chest',
      'description':
          'Abnormal fluid accumulation in the pleural space between lungs and chest wall. Causes shortness of breath, chest pain, and cough. Can be caused by heart failure, infection, or cancer.',
      'model3d': 'assets/3d_models/heart.glb',
    },
    'Infiltrate': {
      'category': 'chest',
      'description':
          'Abnormal substance accumulation in lung tissue, appearing as white patches on X-ray. May indicate inflammation, infection, or fluid buildup. Symptoms include shortness of breath, cough, and chest pain.',
      'model3d': 'assets/3d_models/heart.glb',
    },
    'Mass': {
      'category': 'chest',
      'description':
          'Abnormal growth larger than 3cm in the lung. Appears as a rounded shadow on X-ray. May be benign or malignant, requiring further investigation with CT scan or biopsy.',
      'model3d': 'assets/3d_models/heart.glb',
    },
    'Nodule': {
      'category': 'chest',
      'description':
          'Small abnormal growth less than 3cm in the lung, often appearing as a white spot on X-ray. Most are benign, but monitoring is important. Usually asymptomatic and found incidentally.',
      'model3d': 'assets/3d_models/heart.glb',
    },
    'Pneumonia': {
      'category': 'chest',
      'description':
          'Lung infection causing inflammation and fluid-filled air sacs. Symptoms include cough with phlegm, fever, chest pain, and difficulty breathing. Can be caused by bacteria, viruses, or fungi.',
      'model3d': 'assets/3d_models/heart.glb',
    },
    'Pneumothorax': {
      'category': 'chest',
      'description':
          'Collapsed lung caused by air leaking into the pleural space. Causes sudden sharp chest pain and shortness of breath. Requires immediate medical attention, especially if severe.',
      'model3d': 'assets/3d_models/heart.glb',
    },

    // Brain MRI Conditions
    'Tumor-Cell': {
      'category': 'brain',
      'description':
          'Brain tumor (glioma) originating from glial cells. Symptoms include headaches, nausea, vision problems, seizures, and cognitive changes. Appears as irregular mass on MRI with possible enhancement and edema.',
      'model3d': 'assets/3d_models/heart.glb',
    },

    // Heart Sound Conditions
    'Normal Heart Sound': {
      'category': 'heart_sound',
      'description':
          'Normal cardiac sounds with no detectable abnormalities. The heart valves are functioning properly with regular rhythm and no murmurs detected.',
      'severity': 'LOW',
    },
    'Aortic Stenosis': {
      'category': 'heart_sound',
      'description':
          'Narrowing of the aortic valve restricting blood flow from the heart to the aorta. Produces a characteristic crescendo-decrescendo systolic murmur. Can lead to chest pain, fainting, and heart failure if untreated.',
      'severity': 'HIGH',
    },
    'Mitral Regurgitation': {
      'category': 'heart_sound',
      'description':
          'Backward flow of blood through the mitral valve during systole. Produces a blowing holosystolic murmur heard best at the apex. May cause fatigue, shortness of breath, and heart palpitations.',
      'severity': 'MEDIUM',
    },
    'Mitral Stenosis': {
      'category': 'heart_sound',
      'description':
          'Narrowing of the mitral valve obstructing blood flow from left atrium to left ventricle. Produces a low-pitched diastolic rumble with an opening snap. Can cause shortness of breath, fatigue, and atrial fibrillation.',
      'severity': 'HIGH',
    },
    'Mitral Valve Prolapse': {
      'category': 'heart_sound',
      'description':
          'Mitral valve leaflets bulge back into the left atrium during systole. Often produces a mid-systolic click followed by a late systolic murmur. Usually benign but may require monitoring.',
      'severity': 'LOW',
    },
  };

  static Map<String, dynamic>? getDiseaseInfo(String diseaseName) {
    return diseases[diseaseName];
  }

  static String getModelPath(String category) {
    switch (category) {
      case 'skin':
        return 'assets/models/skin_float16.tflite';
      case 'chest':
        return 'assets/models/chest_float16.tflite';
      case 'brain':
        return 'assets/models/brain_float16.tflite';
      default:
        return '';
    }
  }

  static bool isClassificationModel(String category) {
    // All current models are object detection
    return false;
  }

  static List<String> getLabels(String category) {
    switch (category) {
      case 'skin':
        return [
          'Actinic Keratoses and Intraepithelial Carcinoma',
          'Basal Cell Carcinoma',
          'Benign Keratosis-like Lesions',
          'Dermatofibroma',
          'Melanocytic Nevi',
          'Melanoma',
          'Vascular Lesions',
        ];
      case 'chest':
        return [
          'Atelectasis',
          'Cardiomegaly',
          'Effusion',
          'Infiltrate',
          'Mass',
          'Nodule',
          'Pneumonia',
          'Pneumothorax',
        ];
      case 'brain':
        return ['Tumor-Cell'];
      default:
        return [];
    }
  }
}
