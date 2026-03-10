import 'dart:async';
import 'dart:math';
import 'dart:ui';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:medicoscope/screens/welcome/welcome_screen.dart';

/// Scroll-driven frame animation with smooth interpolation.
/// Skip button triggers fast auto-play through remaining frames.
class StorylineScreen extends StatefulWidget {
  const StorylineScreen({super.key});

  @override
  State<StorylineScreen> createState() => _StorylineScreenState();
}

class _StorylineScreenState extends State<StorylineScreen>
    with SingleTickerProviderStateMixin {
  // ── Smooth scroll state ──
  double _targetFraction = 0; // where user wants to be (0..1)
  double _displayFraction = 0; // smoothly interpolated value
  int _currentFrame = 1;
  bool _navigated = false;

  // ── Auto-play state ──
  late final AnimationController _autoPlayController;
  double _autoPlayStart = 0;
  bool _isAutoPlaying = false;

  // ── Smooth ticker ──
  late final Ticker _ticker;

  // ── Preloading ──
  double _loadProgress = 0;
  bool _ready = false;
  late final List<NetworkImage> _providers;
  final Set<int> _cachedFrames = {};

  static const int _totalFrames = 826;
  static const int _batchSize = 30;
  // How much one mouse wheel tick scrolls (fraction of total)
  static const double _scrollSensitivity = 0.008;
  // Lerp factor per frame — higher = snappier, lower = smoother
  static const double _smoothFactor = 0.12;

  @override
  void initState() {
    super.initState();
    _providers = List.generate(
      _totalFrames,
      (i) => NetworkImage(_framePath(i + 1)),
    );

    // Auto-play animation controller (6 seconds for full playback)
    _autoPlayController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..addListener(_onAutoPlayTick);

    // Smooth interpolation ticker — runs every frame
    _ticker = createTicker(_onTick)..start();

    WidgetsBinding.instance.addPostFrameCallback((_) => _preloadAll());
  }

  @override
  void dispose() {
    _ticker.dispose();
    _autoPlayController.dispose();
    super.dispose();
  }

  // ── Frame path ─────────────────────────────────────────────────────────────

  String _framePath(int frame) =>
      'walkthrough/ezgif-frame-${frame.toString().padLeft(3, '0')}.jpg';

  // ── Preload ────────────────────────────────────────────────────────────────

  Future<void> _preloadAll() async {
    int loaded = 0;

    for (int start = 0; start < _totalFrames; start += _batchSize) {
      if (!mounted) return;
      final end = min(start + _batchSize, _totalFrames);
      final futures = <Future>[];

      for (int i = start; i < end; i++) {
        futures.add(
          precacheImage(_providers[i], context).then((_) {
            _cachedFrames.add(i + 1);
            loaded++;
          }).catchError((_) {
            loaded++;
          }),
        );
      }

      await Future.wait(futures);

      if (mounted) {
        final progress = loaded / _totalFrames;
        setState(() {
          _loadProgress = progress;
          if (!_ready && progress >= 0.15) _ready = true;
        });
      }
    }

    if (mounted && !_ready) setState(() => _ready = true);
  }

  // ── Smooth ticker (runs every frame ~60fps) ────────────────────────────────

  void _onTick(Duration elapsed) {
    if (!_ready) return;

    // Lerp toward target
    final diff = _targetFraction - _displayFraction;
    if (diff.abs() < 0.0001) {
      // Close enough — snap
      if (_displayFraction != _targetFraction) {
        _displayFraction = _targetFraction;
        _updateFrame();
      }
      return;
    }

    _displayFraction = lerpDouble(_displayFraction, _targetFraction, _smoothFactor)!;
    _updateFrame();
  }

  void _updateFrame() {
    final fraction = _displayFraction.clamp(0.0, 1.0);
    final targetFrame = (fraction * (_totalFrames - 1)).round() + 1;

    final displayFrame = _cachedFrames.contains(targetFrame)
        ? targetFrame
        : _nearestCachedFrame(targetFrame);

    if (displayFrame != _currentFrame || fraction != _displayFraction) {
      setState(() {
        _currentFrame = displayFrame;
      });
    }

    // Auto-navigate at the end
    if (fraction >= 0.99 && !_navigated) {
      _navigated = true;
      Future.delayed(const Duration(milliseconds: 400), _navigateToWelcome);
    }
  }

  int _nearestCachedFrame(int target) {
    if (_cachedFrames.isEmpty) return 1;
    int best = _currentFrame;
    int bestDist = (target - best).abs();
    for (int d = 1; d <= 30; d++) {
      if (target + d <= _totalFrames && _cachedFrames.contains(target + d)) {
        if (d < bestDist) best = target + d;
        break;
      }
      if (target - d >= 1 && _cachedFrames.contains(target - d)) {
        if (d < bestDist) best = target - d;
        break;
      }
    }
    return best;
  }

  // ── Pointer / scroll input ─────────────────────────────────────────────────

  void _onPointerSignal(PointerSignalEvent event) {
    if (!_ready || _isAutoPlaying) return;
    if (event is PointerScrollEvent) {
      // scrollDelta.dy > 0 = scroll down = advance, < 0 = scroll up = rewind
      final delta = event.scrollDelta.dy > 0
          ? _scrollSensitivity
          : -_scrollSensitivity;
      _targetFraction = (_targetFraction + delta).clamp(0.0, 1.0);
    }
  }

  // Track drag for touch / trackpad
  void _onVerticalDragUpdate(DragUpdateDetails details) {
    if (!_ready || _isAutoPlaying) return;
    final screenH = MediaQuery.of(context).size.height;
    // Dragging up (negative dy) = advance
    final delta = -details.delta.dy / (screenH * 2);
    _targetFraction = (_targetFraction + delta).clamp(0.0, 1.0);
  }

  // ── Auto-play (skip) ──────────────────────────────────────────────────────

  void _startAutoPlay() {
    if (_isAutoPlaying) return;
    _isAutoPlaying = true;
    _autoPlayStart = _displayFraction;

    // Scale duration based on how much is left
    final remaining = 1.0 - _autoPlayStart;
    final ms = (remaining * 6000).round().clamp(1000, 6000);
    _autoPlayController.duration = Duration(milliseconds: ms);
    _autoPlayController.forward(from: 0);

    setState(() {}); // hide skip button
  }

  void _onAutoPlayTick() {
    final t = Curves.easeInOut.transform(_autoPlayController.value);
    _targetFraction = _autoPlayStart + (1.0 - _autoPlayStart) * t;
    // During auto-play, skip the lerp and drive display directly for smoothness
    _displayFraction = _targetFraction;
    _updateFrame();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  void _navigateToWelcome() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, animation, __) => const WelcomeScreen(),
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
        transitionDuration: const Duration(milliseconds: 800),
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final fraction = _displayFraction.clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: const Color(0xFF050505),
      body: Listener(
        onPointerSignal: _onPointerSignal,
        child: GestureDetector(
          onVerticalDragUpdate: _onVerticalDragUpdate,
          behavior: HitTestBehavior.translucent,
          child: Stack(
            children: [
              // Frame image
              Positioned.fill(
                child: RepaintBoundary(
                  child: Image(
                    image: _providers[_currentFrame - 1],
                    fit: BoxFit.cover,
                    gaplessPlayback: true,
                    errorBuilder: (_, __, ___) =>
                        Container(color: const Color(0xFF050505)),
                  ),
                ),
              ),

              // Loading overlay
              if (!_ready)
                Positioned.fill(
                  child: Container(
                    color: const Color(0xFF050505),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 200,
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: _loadProgress,
                                minHeight: 3,
                                backgroundColor: Colors.white.withOpacity(0.1),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white.withOpacity(0.7),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Loading experience… ${(_loadProgress * 100).toInt()}%',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.5),
                              fontSize: 13,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // Skip button — triggers auto-play
              if (_ready && fraction < 0.95 && !_isAutoPlaying)
                Positioned(
                  bottom: 40,
                  right: 40,
                  child: _SkipButton(onTap: _startAutoPlay),
                ),

              // Scroll-down hint
              if (_ready && fraction < 0.04 && !_isAutoPlaying)
                const Positioned(
                  bottom: 100,
                  left: 0,
                  right: 0,
                  child: _ScrollHint(),
                ),

              // Progress bar
              if (_ready)
                Positioned(
                  bottom: 0,
                  left: 0,
                  child: Container(
                    height: 2,
                    width: screenWidth * fraction,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.white.withOpacity(0.15),
                          Colors.white.withOpacity(0.7),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Skip button ──────────────────────────────────────────────────────────────

class _SkipButton extends StatefulWidget {
  final VoidCallback onTap;
  const _SkipButton({required this.onTap});

  @override
  State<_SkipButton> createState() => _SkipButtonState();
}

class _SkipButtonState extends State<_SkipButton> {
  bool _hovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovering = true),
      onExit: (_) => setState(() => _hovering = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 13),
          decoration: BoxDecoration(
            border: Border.all(
              color: Colors.white.withOpacity(_hovering ? 0.5 : 0.25),
            ),
            borderRadius: BorderRadius.circular(50),
            color: Colors.white.withOpacity(_hovering ? 0.15 : 0.07),
          ),
          transform: _hovering
              ? (Matrix4.identity()..translate(0.0, -2.0))
              : Matrix4.identity(),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'SKIP',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.85),
                  fontSize: 13,
                  letterSpacing: 2.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 10),
              Icon(
                Icons.double_arrow_rounded,
                color: Colors.white.withOpacity(0.85),
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Scroll-down hint ─────────────────────────────────────────────────────────

class _ScrollHint extends StatelessWidget {
  const _ScrollHint();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'SCROLL TO EXPLORE',
          style: TextStyle(
            color: Colors.white.withOpacity(0.6),
            fontSize: 12,
            letterSpacing: 3,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Icon(
          Icons.keyboard_double_arrow_down_rounded,
          color: Colors.white.withOpacity(0.5),
          size: 28,
        ),
      ],
    );
  }
}
