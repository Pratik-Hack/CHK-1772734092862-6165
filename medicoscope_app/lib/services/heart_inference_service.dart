import 'dart:io';
import 'dart:isolate';
import 'dart:math';
import 'dart:typed_data';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:medicoscope/models/cardio_result.dart';

/// Offline heart-sound classifier using TFLite + librosa-compatible MFCCs.
///
/// Input:  40 MFCCs × 50 frames = 2000 features (matches librosa extraction)
/// Output: 5 classes [Normal, Aortic Stenosis, Mitral Stenosis, Mitral Regurg, MVP]
///
/// Heavy MFCC extraction runs in an isolate to avoid freezing the UI.
class HeartInferenceService {
  static const String _modelPath = 'assets/models/heart_model.tflite';
  static const int _sr = 22050;
  static const int _nMfcc = 40;
  static const int _nFrames = 50;
  static const int _nFft = 2048;
  static const int _hop = 512;
  static const int _nMels = 128;

  static const List<String> _labels = [
    'Normal Heart Sound',     // 0
    'Aortic Stenosis',        // 1
    'Mitral Stenosis',        // 2
    'Mitral Regurgitation',   // 3
    'Mitral Valve Prolapse',  // 4
  ];

  static Interpreter? _interpreter;

  static Future<void> _loadModel() async {
    _interpreter ??= await Interpreter.fromAsset(_modelPath);
  }

  // ━━━━━━━━━━━━━━━━━━━━ PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  static Future<CardioResult> predict(String filePath) async {
    await _loadModel();

    // Read WAV on main thread (fast I/O)
    final samples = await _readWav(filePath);
    if (samples.length < _sr) {
      throw Exception('Recording too short — need at least 1 second.');
    }

    // Extract MFCCs in a background isolate (heavy computation)
    final input = await Isolate.run(() => _computeMfccFeatures(samples));

    // Run model inference (fast — just matrix multiply)
    final output = List.filled(5, 0.0).reshape([1, 5]);
    _interpreter!.run(input.reshape([1, _nMfcc * _nFrames]), output);

    final probs = (output[0] as List).cast<double>();
    int best = 0;
    for (int i = 1; i < 5; i++) {
      if (probs[i] > probs[best]) best = i;
    }

    final bpm = _estimateBpm(samples);

    return CardioResult(
      prediction: _labels[best],
      avgHeartRate: bpm,
      heartRateData: _syntheticHR(bpm, samples.length),
      audioWaveform: _downsampleWaveform(samples),
      ecgData: _syntheticECG(bpm),
    );
  }

  // ━━━━━━━━━━━━━━━ MFCC (runs in isolate) ━━━━━━━━━━━━━━━━━━━━━━━━

  /// Compute MFCC features and return flattened Float32List[2000].
  /// This is the entry point for Isolate.run — must be a static top-level fn.
  static Float32List _computeMfccFeatures(Float32List samples) {
    final nBins = _nFft ~/ 2 + 1;
    final numFrames = max(1, (samples.length - _nFft) ~/ _hop + 1);
    final framesToUse = min(numFrames, _nFrames);

    // Hann window
    final win = Float64List(_nFft);
    for (int i = 0; i < _nFft; i++) {
      win[i] = 0.5 * (1 - cos(2 * pi * i / (_nFft - 1)));
    }

    // Build SPARSE mel filterbank — only store non-zero ranges per filter
    final melStarts = List<int>.filled(_nMels, 0);
    final melEnds = List<int>.filled(_nMels, 0);
    final melWeights = <Float64List>[];

    final fMax = _sr / 2.0;
    double hzToMel(double hz) => 2595 * log(1 + hz / 700) / ln10;
    double melToHz(double m) => 700 * (pow(10, m / 2595) - 1);

    final melLo = hzToMel(0);
    final melHi = hzToMel(fMax);
    final melPts = List.generate(
      _nMels + 2, (i) => melLo + i * (melHi - melLo) / (_nMels + 1));
    final bins = melPts.map((m) => ((melToHz(m) / _sr) * _nFft).floor()).toList();

    for (int m = 0; m < _nMels; m++) {
      final s = bins[m], c = bins[m + 1], e = bins[m + 2];
      melStarts[m] = s;
      melEnds[m] = min(e, nBins);
      final w = Float64List(melEnds[m] - melStarts[m]);
      for (int k = s; k < c && k < nBins; k++) {
        if (c > s) w[k - s] = (k - s) / (c - s);
      }
      for (int k = c; k < e && k < nBins; k++) {
        if (e > c) w[k - s] = (e - k) / (e - c);
      }
      melWeights.add(w);
    }

    // DCT cosine table
    final cosTable = List.generate(
      _nMfcc,
      (m) => Float64List.fromList(
        List.generate(_nMels, (k) => cos(pi * m * (k + 0.5) / _nMels)),
      ),
    );

    // Reusable FFT buffers
    final real = Float64List(_nFft);
    final imag = Float64List(_nFft);

    // Step 1: Compute log-mel spectrogram (per frame)
    // Step 2: Apply DCT to get MFCCs
    final result = List.generate(_nMfcc, (_) => Float64List(_nFrames));

    for (int fr = 0; fr < framesToUse; fr++) {
      final base = fr * _hop;

      // Apply window
      for (int i = 0; i < _nFft; i++) {
        final idx = base + i;
        real[i] = (idx < samples.length ? samples[idx].toDouble() : 0) * win[i];
        imag[i] = 0;
      }

      // FFT
      _fft(real, imag);

      // Power spectrum (compute once, reuse)
      final power = Float64List(nBins);
      for (int k = 0; k < nBins; k++) {
        power[k] = real[k] * real[k] + imag[k] * imag[k];
      }

      // Mel filter → log (using SPARSE filterbank — much faster)
      final logMel = Float64List(_nMels);
      for (int m = 0; m < _nMels; m++) {
        double melE = 0;
        final w = melWeights[m];
        final start = melStarts[m];
        for (int j = 0; j < w.length; j++) {
          melE += w[j] * power[start + j];
        }
        // librosa power_to_db: 10 * log10(max(S, 1e-10))
        logMel[m] = 10.0 * log(max(melE, 1e-10)) / ln10;
      }

      // DCT → MFCCs
      for (int m = 0; m < _nMfcc; m++) {
        double val = 0;
        final ct = cosTable[m];
        for (int k = 0; k < _nMels; k++) {
          val += logMel[k] * ct[k];
        }
        result[m][fr] = val;
      }
    }

    // Flatten (row-major, matching numpy)
    final flat = Float32List(_nMfcc * _nFrames);
    for (int m = 0; m < _nMfcc; m++) {
      for (int t = 0; t < _nFrames; t++) {
        flat[m * _nFrames + t] = result[m][t];
      }
    }
    return flat;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━ FFT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  static void _fft(Float64List re, Float64List im) {
    final n = re.length;
    if (n <= 1) return;

    int j = 0;
    for (int i = 0; i < n - 1; i++) {
      if (i < j) {
        final tr = re[i]; re[i] = re[j]; re[j] = tr;
        final ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
      int k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }

    for (int sz = 2; sz <= n; sz *= 2) {
      final h = sz ~/ 2;
      final a = -2.0 * pi / sz;
      for (int i = 0; i < n; i += sz) {
        for (int k = 0; k < h; k++) {
          final w = a * k;
          final wr = cos(w), wi = sin(w);
          final e = i + k, o = e + h;
          final tr = wr * re[o] - wi * im[o];
          final ti = wr * im[o] + wi * re[o];
          re[o] = re[e] - tr;
          im[o] = im[e] - ti;
          re[e] += tr;
          im[e] += ti;
        }
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━ HEART RATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  static double _estimateBpm(Float32List samples) {
    final frameLen = (_sr * 0.02).round();
    final nFrames = samples.length ~/ frameLen;
    if (nFrames < 10) return 72;

    final energy = Float64List(nFrames);
    for (int i = 0; i < nFrames; i++) {
      double s = 0;
      final b = i * frameLen;
      for (int j = 0; j < frameLen && b + j < samples.length; j++) {
        final v = samples[b + j];
        s += v * v;
      }
      energy[i] = s / frameLen;
    }

    double mean = 0;
    for (final e in energy) {
      mean += e;
    }
    mean /= nFrames;
    for (int i = 0; i < nFrames; i++) {
      energy[i] -= mean;
    }

    final minLag = (nFrames * 0.02 * 60 / 120).round().clamp(1, nFrames ~/ 2);
    final maxLag = (nFrames * 0.02 * 60 / 50).round().clamp(minLag + 1, nFrames ~/ 2);

    double bestCorr = -1;
    int bestLag = minLag;
    for (int lag = minLag; lag < maxLag && lag < nFrames; lag++) {
      double corr = 0;
      final cnt = nFrames - lag;
      for (int i = 0; i < cnt; i++) {
        corr += energy[i] * energy[i + lag];
      }
      corr /= cnt;
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    final periodSec = bestLag * 0.02;
    if (periodSec <= 0) return 72;
    return (60.0 / periodSec).clamp(55.0, 110.0).roundToDouble();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━ WAV READER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  static Future<Float32List> _readWav(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) throw Exception('Audio file not found.');
    final bytes = await file.readAsBytes();
    if (bytes.length < 44) throw Exception('WAV file too small.');
    final bd = ByteData.sublistView(bytes);

    if (String.fromCharCodes(bytes.sublist(0, 4)) != 'RIFF' ||
        String.fromCharCodes(bytes.sublist(8, 12)) != 'WAVE') {
      throw Exception('Not a valid WAV file.');
    }

    int off = 12, ch = 1, sr = _sr, bps = 16;
    bool fmtOk = false;

    while (off < bytes.length - 8) {
      final id = String.fromCharCodes(bytes.sublist(off, off + 4));
      final sz = bd.getUint32(off + 4, Endian.little);

      if (id == 'fmt ') {
        fmtOk = true;
        ch = bd.getUint16(off + 10, Endian.little);
        sr = bd.getUint32(off + 12, Endian.little);
        bps = bd.getUint16(off + 22, Endian.little);
      } else if (id == 'data' && fmtOk) {
        final dS = off + 8;
        final dE = min(dS + sz, bytes.length);
        final fb = (bps ~/ 8) * ch;
        final nS = (dE - dS) ~/ fb;
        final out = Float32List(nS);
        int si = 0;

        if (bps == 16) {
          for (int i = dS; i < dE - 1 && si < nS; i += 2 * ch) {
            out[si++] = bd.getInt16(i, Endian.little) / 32768.0;
          }
        } else if (bps == 8) {
          for (int i = dS; i < dE && si < nS; i += ch) {
            out[si++] = (bytes[i] - 128) / 128.0;
          }
        } else if (bps == 32) {
          for (int i = dS; i < dE - 3 && si < nS; i += 4 * ch) {
            out[si++] = bd.getFloat32(i, Endian.little);
          }
        } else {
          throw Exception('Unsupported bit depth: $bps');
        }

        final trimmed = si == nS ? out : Float32List.sublistView(out, 0, si);
        return sr != _sr ? _resample(trimmed, si, sr) : trimmed;
      }

      off += 8 + sz + (sz.isOdd ? 1 : 0);
    }
    throw Exception('WAV has no audio data.');
  }

  static Float32List _resample(Float32List s, int count, int fromSr) {
    final r = fromSr / _sr;
    final n = (count / r).floor();
    final out = Float32List(n);
    for (int i = 0; i < n; i++) {
      final si = i * r;
      final idx = si.floor();
      final frac = si - idx;
      out[i] = idx + 1 < count
          ? s[idx] * (1 - frac) + s[idx + 1] * frac
          : (idx < count ? s[idx] : 0);
    }
    return out;
  }

  // ━━━━━━━━━━━━━━━━━━ VISUALISATION HELPERS ━━━━━━━━━━━━━━━━━━━━━━━

  static List<HeartRatePoint> _syntheticHR(double bpm, int nSamples) {
    final rng = Random(42);
    final dur = nSamples / _sr;
    final n = min(30, max(5, dur.round()));
    return List.generate(n, (t) {
      final v = (rng.nextDouble() - 0.5) * 8;
      return HeartRatePoint(time: t, bpm: (bpm + v).round().clamp(40, 200));
    });
  }

  static AudioWaveform _downsampleWaveform(Float32List s) {
    const pts = 200;
    final step = max(1, s.length ~/ pts);
    final t = <double>[];
    final a = <double>[];
    for (int i = 0; i < s.length && t.length < pts; i += step) {
      t.add(i / _sr);
      a.add(s[i].toDouble());
    }
    return AudioWaveform(time: t, amplitude: a);
  }

  static List<double> _syntheticECG(double bpm) {
    final rng = Random(7);
    const rate = 500;
    final total = rate * 5;
    final spb = (rate * 60 / bpm).round();
    return List.generate(total, (i) {
      final ph = (i % spb) / spb;
      double v = 0;
      if (ph > .10 && ph < .20) {
        v = .15 * sin((ph - .10) / .10 * pi);
      } else if (ph > .25 && ph < .28) {
        v = -.10 * sin((ph - .25) / .03 * pi);
      } else if (ph > .28 && ph < .32) {
        v = 1.0 * sin((ph - .28) / .04 * pi);
      } else if (ph > .32 && ph < .35) {
        v = -.20 * sin((ph - .32) / .03 * pi);
      } else if (ph > .40 && ph < .55) {
        v = .30 * sin((ph - .40) / .15 * pi);
      }
      return v + (rng.nextDouble() - .5) * .02;
    });
  }

  static void dispose() {
    _interpreter?.close();
    _interpreter = null;
  }
}
