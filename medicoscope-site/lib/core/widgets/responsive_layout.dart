import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:medicoscope/core/theme/app_theme.dart';
import 'package:medicoscope/core/providers/auth_provider.dart';
import 'package:medicoscope/core/locale/locale_provider.dart';
import 'package:medicoscope/core/locale/app_strings.dart';
import 'package:medicoscope/core/widgets/language_picker.dart';
import 'package:medicoscope/core/widgets/theme_toggle_button.dart';
import 'package:medicoscope/screens/profile/profile_screen.dart';
import 'package:medicoscope/screens/linking/my_code_screen.dart';
import 'package:medicoscope/screens/linking/link_doctor_screen.dart';
import 'package:medicoscope/screens/patients/patient_list_screen.dart';
import 'package:medicoscope/screens/chat/chat_history_screen.dart';
import 'package:medicoscope/screens/mental_health/mindspace_history_screen.dart';
import 'package:medicoscope/screens/rewards/claimed_rewards_screen.dart';
import 'package:medicoscope/screens/welcome/welcome_screen.dart';
import 'package:provider/provider.dart';
import 'package:medicoscope/core/theme/theme_provider.dart';

/// Breakpoints for responsive layout
class Breakpoints {
  static const double mobile = 600;
  static const double tablet = 900;
  static const double desktop = 1200;
}

/// Returns true if the screen is wide enough for desktop layout
bool isDesktop(BuildContext context) =>
    MediaQuery.of(context).size.width >= Breakpoints.tablet;

bool isWideDesktop(BuildContext context) =>
    MediaQuery.of(context).size.width >= Breakpoints.desktop;

/// Responsive scaffold that shows a persistent sidebar on desktop
/// and uses the standard drawer on mobile.
class ResponsiveScaffold extends StatelessWidget {
  final Widget body;
  final Widget? floatingActionButton;
  final int selectedIndex;

  const ResponsiveScaffold({
    super.key,
    required this.body,
    this.floatingActionButton,
    this.selectedIndex = 0,
  });

  @override
  Widget build(BuildContext context) {
    final wide = isDesktop(context);

    if (!wide || !kIsWeb) {
      // Mobile / tablet — use original layout (drawer-based)
      return body;
    }

    // Desktop web — sidebar + content
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.isDarkMode;

    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          _WebSidebar(isDark: isDark, selectedIndex: selectedIndex),
          // Vertical divider
          Container(
            width: 1,
            color: isDark ? Colors.white10 : Colors.grey.shade300,
          ),
          // Main content area
          Expanded(
            child: Stack(
              children: [
                body,
                if (floatingActionButton != null)
                  Positioned(
                    right: 24,
                    bottom: 24,
                    child: floatingActionButton!,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WebSidebar extends StatelessWidget {
  final bool isDark;
  final int selectedIndex;

  const _WebSidebar({required this.isDark, required this.selectedIndex});

  void _navigateTo(BuildContext context, Widget screen) {
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => screen,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final lang = Provider.of<LocaleProvider>(context).languageCode;
    final user = authProvider.user;

    return Container(
      width: 260,
      color: isDark ? AppTheme.darkBackground : Colors.white,
      child: Column(
        children: [
          // Logo header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            decoration: BoxDecoration(
              gradient: AppTheme.orangeGradient,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.local_hospital_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'MedicoScope',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // User info
                Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: Colors.white.withOpacity(0.2),
                      child: Text(
                        user?.name.isNotEmpty == true
                            ? user!.name[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'User',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            authProvider.isAdmin
                                ? 'Admin'
                                : authProvider.isPatient
                                    ? AppStrings.get('patient', lang)
                                    : AppStrings.get('doctor', lang),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.white.withOpacity(0.8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Navigation items
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SidebarItem(
                    icon: Icons.dashboard_rounded,
                    label: 'Dashboard',
                    isSelected: true,
                    isDark: isDark,
                    onTap: () {}, // Already on dashboard
                  ),
                  _SidebarItem(
                    icon: Icons.person_outlined,
                    label: AppStrings.get('profile', lang),
                    isDark: isDark,
                    onTap: () => _navigateTo(context, const ProfileScreen()),
                  ),
                  _SidebarItem(
                    icon: Icons.qr_code,
                    label: AppStrings.get('my_code', lang),
                    isDark: isDark,
                    onTap: () => _navigateTo(context, const MyCodeScreen()),
                  ),
                  if (authProvider.isPatient)
                    _SidebarItem(
                      icon: Icons.link,
                      label: AppStrings.get('link_to_doctor', lang),
                      isDark: isDark,
                      onTap: () =>
                          _navigateTo(context, const LinkDoctorScreen()),
                    ),
                  if (authProvider.isDoctor)
                    _SidebarItem(
                      icon: Icons.people_outlined,
                      label: AppStrings.get('my_patients', lang),
                      isDark: isDark,
                      onTap: () =>
                          _navigateTo(context, const PatientListScreen()),
                    ),

                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Divider(
                      color: isDark ? Colors.white12 : Colors.grey.shade300,
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.only(left: 16, bottom: 4),
                    child: Text(
                      'HISTORY',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppTheme.darkTextDim : AppTheme.textLight,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),

                  _SidebarItem(
                    icon: Icons.chat_outlined,
                    label: 'Chat History',
                    isDark: isDark,
                    onTap: () =>
                        _navigateTo(context, const ChatHistoryScreen()),
                  ),
                  if (authProvider.isPatient) ...[
                    _SidebarItem(
                      icon: Icons.spa_outlined,
                      label: 'MindSpace History',
                      isDark: isDark,
                      onTap: () => _navigateTo(
                          context, const MindSpaceHistoryScreen()),
                    ),
                    _SidebarItem(
                      icon: Icons.card_giftcard_outlined,
                      label: 'My Rewards',
                      isDark: isDark,
                      onTap: () =>
                          _navigateTo(context, const ClaimedRewardsScreen()),
                    ),
                  ],

                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Divider(
                      color: isDark ? Colors.white12 : Colors.grey.shade300,
                    ),
                  ),

                  // Language picker
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: LanguagePicker(),
                  ),

                  const SizedBox(height: 8),

                  // Theme toggle
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      children: [
                        Icon(
                          isDark ? Icons.dark_mode : Icons.light_mode,
                          size: 20,
                          color: isDark
                              ? AppTheme.darkTextGray
                              : AppTheme.textGray,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          isDark ? 'Dark Mode' : 'Light Mode',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark
                                ? AppTheme.darkTextGray
                                : AppTheme.textGray,
                          ),
                        ),
                        const Spacer(),
                        const ThemeToggleButton(size: 32),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Logout button at bottom
          Container(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: () async {
                  await authProvider.logout();
                  if (context.mounted) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(
                        builder: (_) => const WelcomeScreen(),
                      ),
                      (route) => false,
                    );
                  }
                },
                icon: Icon(Icons.logout, size: 18, color: Colors.red.shade400),
                label: Text(
                  AppStrings.get('logout', lang),
                  style: TextStyle(
                    color: Colors.red.shade400,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                style: TextButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.red.shade200),
                  ),
                ),
              ),
            ),
          ),

          // Version
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              AppStrings.get('version', lang),
              style: TextStyle(
                fontSize: 11,
                color: isDark ? AppTheme.darkTextDim : AppTheme.textLight,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SidebarItem extends StatefulWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final bool isDark;
  final VoidCallback onTap;

  const _SidebarItem({
    required this.icon,
    required this.label,
    this.isSelected = false,
    required this.isDark,
    required this.onTap,
  });

  @override
  State<_SidebarItem> createState() => _SidebarItemState();
}

class _SidebarItemState extends State<_SidebarItem> {
  bool _hovering = false;

  @override
  Widget build(BuildContext context) {
    final isActive = widget.isSelected;
    final color = isActive
        ? AppTheme.primaryOrange
        : (_hovering
            ? (widget.isDark ? AppTheme.darkTextLight : AppTheme.textDark)
            : (widget.isDark ? AppTheme.darkTextGray : AppTheme.textGray));

    return MouseRegion(
      onEnter: (_) => setState(() => _hovering = true),
      onExit: (_) => setState(() => _hovering = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.symmetric(vertical: 2),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: isActive
                ? AppTheme.primaryOrange.withOpacity(0.1)
                : (_hovering
                    ? (widget.isDark
                        ? Colors.white.withOpacity(0.05)
                        : Colors.grey.withOpacity(0.08))
                    : Colors.transparent),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Icon(widget.icon, size: 20, color: color),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                    color: color,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A wrapper that constrains content to a max width for readability on wide screens.
/// Use this inside screens that don't use ResponsiveScaffold.
class WebContentConstraint extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final EdgeInsetsGeometry? padding;

  const WebContentConstraint({
    super.key,
    required this.child,
    this.maxWidth = 900,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    if (!kIsWeb) return child;

    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: padding != null
            ? Padding(padding: padding!, child: child)
            : child,
      ),
    );
  }
}
