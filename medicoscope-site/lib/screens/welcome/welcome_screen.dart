import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:medicoscope/core/locale/locale_provider.dart';
import 'package:medicoscope/core/locale/app_strings.dart';
import 'package:medicoscope/core/theme/app_theme.dart';
import 'package:medicoscope/core/widgets/glass_card.dart';
import 'package:medicoscope/core/widgets/theme_toggle_button.dart';
import 'package:medicoscope/core/providers/auth_provider.dart';
import 'package:medicoscope/screens/auth/role_selection_screen.dart';
import 'package:medicoscope/screens/dashboard/patient_dashboard_screen.dart';
import 'package:medicoscope/screens/dashboard/doctor_dashboard_screen.dart';
import 'package:provider/provider.dart';
import 'package:medicoscope/core/theme/theme_provider.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.isDarkMode;
    final lang = Provider.of<LocaleProvider>(context).languageCode;
    final screenWidth = MediaQuery.of(context).size.width;
    final wide = kIsWeb && screenWidth >= 900;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: isDark
              ? AppTheme.darkBackgroundGradient
              : AppTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Stack(
            children: [
              wide
                  ? _buildWebLayout(context, isDark, lang)
                  : _buildMobileLayout(context, isDark, lang),
              // Theme toggle button in top-right corner
              Positioned(
                top: AppTheme.spacingMedium,
                right: AppTheme.spacingMedium,
                child: const ThemeToggleButton(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Desktop web layout — side-by-side hero + info cards
  Widget _buildWebLayout(BuildContext context, bool isDark, String lang) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1100),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 32),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Left side — branding
              Expanded(
                flex: 5,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Logo
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AppTheme.orangeGradient,
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryOrange.withOpacity(0.4),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.favorite,
                          size: 50, color: Colors.white),
                    )
                        .animate()
                        .fadeIn(duration: 600.ms)
                        .scale(
                          begin: const Offset(0.5, 0.5),
                          end: const Offset(1, 1),
                          curve: Curves.elasticOut,
                          duration: 1200.ms,
                        ),

                    const SizedBox(height: 32),

                    Text(
                      AppStrings.get('medicoscope', lang),
                      style: TextStyle(
                        fontSize: 52,
                        fontWeight: FontWeight.w800,
                        color:
                            isDark ? AppTheme.darkTextLight : AppTheme.textDark,
                        letterSpacing: -1,
                      ),
                    )
                        .animate()
                        .fadeIn(delay: 300.ms, duration: 600.ms)
                        .slideX(begin: -0.1, end: 0),

                    const SizedBox(height: 12),

                    Text(
                      AppStrings.get('tagline', lang),
                      style: TextStyle(
                        fontSize: 20,
                        color:
                            isDark ? AppTheme.darkTextGray : AppTheme.textGray,
                        fontWeight: FontWeight.w500,
                        height: 1.5,
                      ),
                    )
                        .animate()
                        .fadeIn(delay: 500.ms, duration: 600.ms)
                        .slideX(begin: -0.1, end: 0),

                    const SizedBox(height: 40),

                    // Enter button
                    SizedBox(
                      width: 280,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () => _navigate(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryOrange,
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(AppTheme.radiusLarge),
                          ),
                        ),
                        child: Text(
                          AppStrings.get('enter_medicoscope', lang),
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    )
                        .animate()
                        .fadeIn(delay: 700.ms, duration: 600.ms)
                        .slideY(begin: 0.2, end: 0),
                  ],
                ),
              ),

              const SizedBox(width: 60),

              // Right side — feature cards
              Expanded(
                flex: 4,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildFeatureCard(
                        Icons.face_outlined,
                        'AI Skin Analysis',
                        'Detect skin conditions using advanced AI imaging technology',
                        const [Color(0xFFFF8C61), Color(0xFFFF6B35)],
                        500,
                      ),
                      const SizedBox(height: 16),
                      _buildFeatureCard(
                        Icons.monitor_heart_outlined,
                        'Real-time Vitals',
                        'Monitor heart rate, blood pressure, and SpO2 in real-time',
                        const [Color(0xFF667EEA), Color(0xFF764BA2)],
                        600,
                      ),
                      const SizedBox(height: 16),
                      _buildFeatureCard(
                        Icons.favorite_outline,
                        'Heart Sound Analysis',
                        'AI-powered cardiac sound analysis and diagnostics',
                        const [Color(0xFFFF6B6B), Color(0xFFEE5A24)],
                        700,
                      ),
                      const SizedBox(height: 16),
                      _buildFeatureCard(
                        Icons.psychology_outlined,
                        'Mental Health',
                        'Voice-based mental health check-ins with AI support',
                        const [Color(0xFF7C4DFF), Color(0xFF536DFE)],
                        800,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureCard(IconData icon, String title, String description,
      List<Color> colors, int delay) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: colors.first.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.85),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: delay), duration: 600.ms)
        .slideX(begin: 0.15, end: 0);
  }

  /// Original mobile layout
  Widget _buildMobileLayout(BuildContext context, bool isDark, String lang) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minHeight: MediaQuery.of(context).size.height -
              MediaQuery.of(context).padding.top,
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppTheme.spacingXLarge),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: AppTheme.spacingXXLarge),

                  // Logo
                  Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppTheme.orangeGradient,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryOrange.withOpacity(0.4),
                          blurRadius: 30,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.favorite,
                        size: 70, color: Colors.white),
                  )
                      .animate()
                      .fadeIn(duration: 600.ms)
                      .scale(
                        begin: const Offset(0.5, 0.5),
                        end: const Offset(1, 1),
                        curve: Curves.elasticOut,
                        duration: 1200.ms,
                      )
                      .then()
                      .shimmer(
                        duration: 2000.ms,
                        color: Colors.white.withOpacity(0.3),
                      ),

                  const SizedBox(height: AppTheme.spacingXXLarge),

                  Text(
                    AppStrings.get('medicoscope', lang),
                    style: TextStyle(
                      fontSize: 42,
                      fontWeight: FontWeight.w800,
                      color:
                          isDark ? AppTheme.darkTextLight : AppTheme.textDark,
                      letterSpacing: -0.5,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 400.ms, duration: 600.ms)
                      .slideY(begin: 0.3, end: 0),

                  const SizedBox(height: AppTheme.spacingMedium),

                  Text(
                    AppStrings.get('tagline', lang),
                    style: TextStyle(
                      fontSize: 16,
                      color:
                          isDark ? AppTheme.darkTextGray : AppTheme.textGray,
                      fontWeight: FontWeight.w500,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 600.ms, duration: 600.ms)
                      .slideY(begin: 0.3, end: 0),

                  const SizedBox(height: AppTheme.spacingXXLarge),

                  // Info Card
                  GlassCard(
                    padding: const EdgeInsets.all(AppTheme.spacingXLarge),
                    child: Column(
                      children: [
                        Icon(Icons.info_outline,
                            size: 32, color: AppTheme.primaryOrange),
                        const SizedBox(height: AppTheme.spacingMedium),
                        Text(
                          AppStrings.get('first_aid_patients', lang),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textDark,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingSmall),
                        Text(
                          AppStrings.get('first_aid_patients_desc', lang),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            height: 1.6,
                            color: AppTheme.textGray,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingLarge),
                        Divider(
                            color: AppTheme.textLight.withOpacity(0.3)),
                        const SizedBox(height: AppTheme.spacingLarge),
                        Icon(Icons.medical_information_outlined,
                            size: 32, color: AppTheme.primaryOrange),
                        const SizedBox(height: AppTheme.spacingMedium),
                        Text(
                          AppStrings.get('doctor_assistant', lang),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textDark,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingSmall),
                        Text(
                          AppStrings.get('doctor_assistant_desc', lang),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            height: 1.6,
                            color: AppTheme.textGray,
                          ),
                        ),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 800.ms, duration: 600.ms)
                      .slideY(begin: 0.3, end: 0),

                  const SizedBox(height: AppTheme.spacingXXLarge),
                ],
              ),
            ),

            // Bottom section
            Padding(
              padding: const EdgeInsets.all(AppTheme.spacingXLarge),
              child: Column(
                children: [
                  Column(
                    children: [
                      Text(
                        AppStrings.get('swipe_up', lang),
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.textGray,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacingSmall),
                      Icon(
                        Icons.keyboard_arrow_down,
                        color: AppTheme.primaryOrange,
                        size: 32,
                      )
                          .animate(
                              onPlay: (controller) => controller.repeat())
                          .moveY(
                            begin: 0,
                            end: 10,
                            duration: 1000.ms,
                            curve: Curves.easeInOut,
                          )
                          .then()
                          .moveY(
                            begin: 10,
                            end: 0,
                            duration: 1000.ms,
                            curve: Curves.easeInOut,
                          ),
                    ],
                  )
                      .animate()
                      .fadeIn(delay: 1200.ms, duration: 600.ms),

                  const SizedBox(height: AppTheme.spacingLarge),

                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () => _navigate(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryOrange,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppTheme.radiusLarge),
                        ),
                      ),
                      child: Text(
                        AppStrings.get('enter_medicoscope', lang),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 1000.ms, duration: 600.ms)
                      .slideY(begin: 0.2, end: 0),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigate(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    Widget destination;

    if (authProvider.isAuthenticated) {
      destination = authProvider.isPatient
          ? const PatientDashboardScreen()
          : const DoctorDashboardScreen();
    } else {
      destination = const RoleSelectionScreen();
    }

    Navigator.of(context).pushAndRemoveUntil(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => destination,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 600),
      ),
      (route) => false,
    );
  }
}
