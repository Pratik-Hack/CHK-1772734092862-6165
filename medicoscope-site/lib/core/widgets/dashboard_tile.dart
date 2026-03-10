import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:medicoscope/core/theme/app_theme.dart';

class DashboardTile extends StatefulWidget {
  final IconData icon;
  final String title;
  final String description;
  final LinearGradient gradient;
  final VoidCallback onTap;
  final int animationDelay;
  final bool isPlaceholder;

  const DashboardTile({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.gradient,
    required this.onTap,
    this.animationDelay = 0,
    this.isPlaceholder = false,
  });

  @override
  State<DashboardTile> createState() => _DashboardTileState();
}

class _DashboardTileState extends State<DashboardTile> {
  bool _hovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: kIsWeb ? (_) => setState(() => _hovering = true) : null,
      onExit: kIsWeb ? (_) => setState(() => _hovering = false) : null,
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          constraints: const BoxConstraints(minHeight: 100),
          transform: _hovering
              ? (Matrix4.identity()..translate(0.0, -2.0))
              : Matrix4.identity(),
          decoration: BoxDecoration(
            gradient: widget.gradient,
            borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
            boxShadow: [
              BoxShadow(
                color: widget.gradient.colors.first
                    .withOpacity(_hovering ? 0.5 : 0.3),
                blurRadius: _hovering ? 20 : 12,
                offset: Offset(0, _hovering ? 8 : 4),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Background pattern icon
              Positioned(
                right: -10,
                bottom: -10,
                child: Icon(
                  widget.icon,
                  size: 90,
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
              // Content
              Padding(
                padding: const EdgeInsets.all(AppTheme.spacingMedium),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius:
                            BorderRadius.circular(AppTheme.radiusMedium),
                      ),
                      child:
                          Icon(widget.icon, size: 28, color: Colors.white),
                    ),
                    const SizedBox(width: AppTheme.spacingMedium),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  widget.title,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (widget.isPlaceholder) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.25),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'Soon',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.description,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.85),
                              height: 1.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white.withOpacity(0.6),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(
            delay: Duration(milliseconds: widget.animationDelay),
            duration: 600.ms)
        .slideX(begin: 0.15, end: 0);
  }
}
