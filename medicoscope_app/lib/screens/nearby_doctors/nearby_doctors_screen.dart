import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:medicoscope/core/theme/app_theme.dart';
import 'package:medicoscope/core/widgets/glass_card.dart';
import 'package:medicoscope/core/providers/auth_provider.dart';
import 'package:medicoscope/core/constants/api_constants.dart';
import 'package:medicoscope/services/api_service.dart';
import 'package:provider/provider.dart';
import 'package:medicoscope/core/theme/theme_provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

class NearbyDoctorsScreen extends StatefulWidget {
  const NearbyDoctorsScreen({super.key});

  @override
  State<NearbyDoctorsScreen> createState() => _NearbyDoctorsScreenState();
}

class _NearbyDoctorsScreenState extends State<NearbyDoctorsScreen> {
  List<dynamic> _doctors = [];
  List<String> _specializations = ['All'];
  String _selectedSpecialization = 'All';
  bool _isLoading = true;
  bool _locationError = false;
  String _errorMessage = '';
  double? _userLat;
  double? _userLng;
  double _radiusKm = 10;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    setState(() {
      _isLoading = true;
      _locationError = false;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _locationError = true;
          _errorMessage = 'Location services are disabled. Please enable them.';
          _isLoading = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _locationError = true;
            _errorMessage = 'Location permission denied.';
            _isLoading = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _locationError = true;
          _errorMessage = 'Location permission permanently denied. Please enable in settings.';
          _isLoading = false;
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      _userLat = position.latitude;
      _userLng = position.longitude;

      await Future.wait([_loadDoctors(), _loadSpecializations()]);
    } catch (e) {
      if (mounted) {
        setState(() {
          _locationError = true;
          _errorMessage = 'Failed to get location. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadDoctors() async {
    if (_userLat == null || _userLng == null) return;

    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token;
      final api = ApiService(token: token);
      final radiusMeters = (_radiusKm * 1000).toInt();
      final spec = _selectedSpecialization == 'All' ? '' : _selectedSpecialization;
      final response = await api.get(
        '${ApiConstants.nearbyDoctorsSearch}?lat=$_userLat&lng=$_userLng&radius=$radiusMeters&specialization=$spec',
      );
      if (mounted) {
        setState(() {
          _doctors = response['nearbyDoctors'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadSpecializations() async {
    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token;
      final api = ApiService(token: token);
      final response = await api.get(ApiConstants.nearbyDoctorsSpecializations);
      if (mounted) {
        final specs = (response['specializations'] as List?)?.cast<String>() ?? [];
        setState(() {
          _specializations = ['All', ...specs];
        });
      }
    } catch (_) {}
  }

  void _onSpecializationChanged(String spec) {
    setState(() {
      _selectedSpecialization = spec;
      _isLoading = true;
    });
    _loadDoctors();
  }

  void _onRadiusChanged(double km) {
    setState(() {
      _radiusKm = km;
      _isLoading = true;
    });
    _loadDoctors();
  }

  String _formatDistance(dynamic meters) {
    if (meters == null) return '';
    final m = meters is int ? meters : (meters as num).toInt();
    if (m < 1000) return '${m}m away';
    return '${(m / 1000).toStringAsFixed(1)}km away';
  }

  Future<void> _callDoctor(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Provider.of<ThemeProvider>(context).isDarkMode;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: isDark
              ? AppTheme.darkBackgroundGradient
              : AppTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // App Bar
              Padding(
                padding: const EdgeInsets.all(AppTheme.spacingMedium),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.darkCard : Colors.white,
                          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                          boxShadow: AppTheme.cardShadow,
                        ),
                        child: Icon(Icons.arrow_back,
                          color: isDark ? AppTheme.darkTextLight : AppTheme.textDark),
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingMedium),
                    Expanded(
                      child: Text('Nearby Doctors', style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.w800,
                        color: isDark ? AppTheme.darkTextLight : AppTheme.textDark,
                      )),
                    ),
                    // Refresh button
                    GestureDetector(
                      onTap: _initLocation,
                      child: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.darkCard : Colors.white,
                          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                          boxShadow: AppTheme.cardShadow,
                        ),
                        child: Icon(Icons.refresh,
                          color: isDark ? AppTheme.darkTextLight : AppTheme.textDark),
                      ),
                    ),
                  ],
                ),
              ),

              if (_locationError)
                _buildLocationError(isDark)
              else ...[
                // Filters
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMedium),
                  child: Column(
                    children: [
                      // Specialization filter chips
                      SizedBox(
                        height: 40,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _specializations.length,
                          itemBuilder: (context, index) {
                            final spec = _specializations[index];
                            final isSelected = spec == _selectedSpecialization;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: GestureDetector(
                                onTap: () => _onSpecializationChanged(spec),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    gradient: isSelected
                                        ? const LinearGradient(colors: [Color(0xFF4ECDC4), Color(0xFF44A08D)])
                                        : null,
                                    color: isSelected ? null : (isDark ? AppTheme.darkCard : Colors.white),
                                    borderRadius: BorderRadius.circular(20),
                                    boxShadow: isSelected ? [
                                      BoxShadow(
                                        color: const Color(0xFF4ECDC4).withOpacity(0.3),
                                        blurRadius: 8, offset: const Offset(0, 2),
                                      ),
                                    ] : null,
                                  ),
                                  child: Text(spec, style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    color: isSelected ? Colors.white
                                        : (isDark ? AppTheme.darkTextGray : AppTheme.textGray),
                                  )),
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Radius slider
                      Row(
                        children: [
                          Icon(Icons.radar, size: 18,
                            color: isDark ? AppTheme.darkTextGray : AppTheme.textGray),
                          const SizedBox(width: 8),
                          Text('Radius: ${_radiusKm.toInt()}km', style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600,
                            color: isDark ? AppTheme.darkTextLight : AppTheme.textDark,
                          )),
                          Expanded(
                            child: Slider(
                              value: _radiusKm,
                              min: 1,
                              max: 50,
                              divisions: 49,
                              activeColor: const Color(0xFF4ECDC4),
                              onChanged: (v) => setState(() => _radiusKm = v),
                              onChangeEnd: _onRadiusChanged,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                // Doctor count
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingXLarge),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      _isLoading ? 'Searching...' : '${_doctors.length} doctors found',
                      style: TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600,
                        color: isDark ? AppTheme.darkTextGray : AppTheme.textGray,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 8),

                // Results
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : _doctors.isEmpty
                          ? Center(child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.search_off, size: 64,
                                  color: isDark ? AppTheme.darkTextDim : AppTheme.textLight),
                                const SizedBox(height: 12),
                                Text('No doctors found nearby',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600,
                                    color: isDark ? AppTheme.darkTextGray : AppTheme.textGray)),
                                const SizedBox(height: 4),
                                Text('Try increasing the search radius',
                                  style: TextStyle(fontSize: 13,
                                    color: isDark ? AppTheme.darkTextDim : AppTheme.textLight)),
                              ],
                            ))
                          : ListView.builder(
                              physics: const BouncingScrollPhysics(),
                              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMedium),
                              itemCount: _doctors.length,
                              itemBuilder: (context, index) => _buildDoctorCard(_doctors[index], index),
                            ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationError(bool isDark) {
    return Expanded(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingXLarge),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.location_off, size: 80,
                color: isDark ? AppTheme.darkTextDim : AppTheme.textLight),
              const SizedBox(height: 16),
              Text(_errorMessage, textAlign: TextAlign.center, style: TextStyle(
                fontSize: 16, color: isDark ? AppTheme.darkTextGray : AppTheme.textGray,
              )),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _initLocation,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4ECDC4),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDoctorCard(Map<String, dynamic> doc, int index) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final distance = _formatDistance(doc['distance']);

    return GlassCard(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingSmall),
      padding: const EdgeInsets.all(AppTheme.spacingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4ECDC4), Color(0xFF44A08D)],
                  ),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                ),
                child: const Icon(Icons.medical_services, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(doc['name'] ?? '', style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700,
                      color: isDark ? AppTheme.darkTextLight : AppTheme.textDark,
                    )),
                    const SizedBox(height: 2),
                    Text(doc['specialization'] ?? '', style: const TextStyle(
                      fontSize: 13, color: Color(0xFF4ECDC4), fontWeight: FontWeight.w600,
                    )),
                  ],
                ),
              ),
              if (distance.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4ECDC4).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(distance, style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF4ECDC4),
                  )),
                ),
            ],
          ),

          const SizedBox(height: 12),

          // Hospital
          _buildInfoRow(Icons.local_hospital_outlined, doc['hospitalName'] ?? ''),
          if ((doc['address'] ?? '').isNotEmpty)
            _buildInfoRow(Icons.location_on_outlined, doc['address']),

          const SizedBox(height: 10),

          // Call button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _callDoctor(doc['contactNumber'] ?? ''),
              icon: const Icon(Icons.phone, size: 18),
              label: Text('Call: ${doc['contactNumber'] ?? ''}'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4ECDC4),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: Duration(milliseconds: 100 * index), duration: 400.ms)
        .slideY(begin: 0.1, end: 0);
  }

  Widget _buildInfoRow(IconData icon, String text) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: isDark ? AppTheme.darkTextDim : AppTheme.textLight),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: TextStyle(
            fontSize: 13, color: isDark ? AppTheme.darkTextGray : AppTheme.textGray,
          ))),
        ],
      ),
    );
  }
}
