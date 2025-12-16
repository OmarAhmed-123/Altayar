import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';
import 'package:altayar/features/profile/presentation/providers/profile_provider.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  File? _selectedImage;
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOut,
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOutCubic,
      ),
    );

    _animationController.forward();
    _loadProfileData();
  }

  void _loadProfileData() {
    final auth = context.read<AuthProvider>();
    final user = auth.currentUser;
    if (user != null) {
      _nameController.text = user.name;
      _emailController.text = user.email;
      _phoneController.text = user.phone ?? '';
      if (user.profilePictureUrl != null &&
          user.profilePictureUrl!.isNotEmpty) {
        // Profile picture will be loaded from URL
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1024,
      maxHeight: 1024,
    );

    if (picked != null) {
      setState(() {
        _selectedImage = File(picked.path);
        _isEditing = true;
      });
    }
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
      maxWidth: 1024,
      maxHeight: 1024,
    );

    if (picked != null) {
      setState(() {
        _selectedImage = File(picked.path);
        _isEditing = true;
      });
    }
  }

  void _showImagePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('اختر من المعرض'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage();
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('التقط صورة'),
                onTap: () {
                  Navigator.pop(context);
                  _takePhoto();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final profileProvider = context.read<ProfileProvider>();
    final authProvider = context.read<AuthProvider>();

    final success = await profileProvider.updateProfile(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim().isEmpty
          ? null
          : _phoneController.text.trim(),
      profilePicture: _selectedImage,
    );

    if (success && mounted) {
      // Update AuthProvider with new data
      final updatedData = profileProvider.profileData;
      if (updatedData != null) {
        final currentUser = authProvider.currentUser;
        if (currentUser != null) {
          final updatedUser = currentUser.copyWith(
            name: updatedData['name']?.toString() ?? currentUser.name,
            email: updatedData['email']?.toString() ?? currentUser.email,
            phone: updatedData['phone']?.toString(),
            profilePictureUrl: updatedData['profilePictureUrl']?.toString() ??
                updatedData['profile_picture_url']?.toString(),
          );
          // Update the user in AuthProvider
          await authProvider.updateCurrentUser(updatedUser);
        }
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم تحديث الملف الشخصي بنجاح'),
          backgroundColor: Colors.green,
        ),
      );

      setState(() {
        _isEditing = false;
        _selectedImage = null;
      });
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            profileProvider.errorMessage ?? 'فشل تحديث الملف الشخصي',
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final profileProvider = context.watch<ProfileProvider>();
    final user = auth.currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('الملف الشخصي')),
        body: const Center(child: Text('يرجى تسجيل الدخول')),
      );
    }

    final profilePictureUrl = user.profilePictureUrl;
    final String? displayImageUrl = _selectedImage != null
        ? null
        : (profilePictureUrl != null && profilePictureUrl.isNotEmpty
            ? profilePictureUrl
            : null);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primaryGradient.first.withValues(alpha: 0.1),
              AppColors.primaryGradient.last.withValues(alpha: 0.05),
            ],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: CustomScrollView(
                slivers: [
                  // App Bar
                  SliverAppBar(
                    expandedHeight: 200,
                    floating: false,
                    pinned: true,
                    flexibleSpace: FlexibleSpaceBar(
                      title: const Text(
                        'الملف الشخصي',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      background: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: AppColors.primaryGradient,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Content
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            // Profile Picture
                            TweenAnimationBuilder<double>(
                              tween: Tween(begin: 0.0, end: 1.0),
                              duration: const Duration(milliseconds: 600),
                              curve: Curves.elasticOut,
                              builder: (context, value, child) {
                                return Transform.scale(
                                  scale: value,
                                  child: child,
                                );
                              },
                              child: Stack(
                                children: [
                                  Container(
                                    width: 140,
                                    height: 140,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: LinearGradient(
                                        colors: AppColors.primaryGradient,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.primaryGradient.first
                                              .withValues(alpha: 0.3),
                                          blurRadius: 20,
                                          offset: const Offset(0, 10),
                                        ),
                                      ],
                                    ),
                                    child: ClipOval(
                                      child: _selectedImage != null
                                          ? Image.file(
                                              _selectedImage!,
                                              fit: BoxFit.cover,
                                            )
                                          : displayImageUrl != null
                                              ? Image.network(
                                                  displayImageUrl,
                                                  fit: BoxFit.cover,
                                                  errorBuilder:
                                                      (context, error, stack) {
                                                    return Container(
                                                      color: Colors.grey[300],
                                                      child: const Icon(
                                                        Icons.person,
                                                        size: 60,
                                                        color: Colors.white,
                                                      ),
                                                    );
                                                  },
                                                )
                                              : Container(
                                                  color: Colors.grey[300],
                                                  child: const Icon(
                                                    Icons.person,
                                                    size: 60,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                    ),
                                  ),
                                  Positioned(
                                    bottom: 0,
                                    right: 0,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Colors.white,
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black
                                                .withValues(alpha: 0.2),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: IconButton(
                                        icon: const Icon(Icons.camera_alt),
                                        color: AppColors.primaryGradient.first,
                                        onPressed: _showImagePicker,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 40),

                            // Name Field
                            _buildTextField(
                              controller: _nameController,
                              label: 'الاسم الكامل',
                              icon: Icons.person,
                              enabled: true,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'يرجى إدخال الاسم';
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 20),

                            // Email Field
                            _buildTextField(
                              controller: _emailController,
                              label: 'البريد الإلكتروني',
                              icon: Icons.email,
                              enabled: true,
                              keyboardType: TextInputType.emailAddress,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'يرجى إدخال البريد الإلكتروني';
                                }
                                if (!value.contains('@')) {
                                  return 'يرجى إدخال بريد إلكتروني صحيح';
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 20),

                            // Phone Field
                            _buildTextField(
                              controller: _phoneController,
                              label: 'رقم الهاتف (اختياري)',
                              icon: Icons.phone,
                              enabled: true,
                              keyboardType: TextInputType.phone,
                            ),

                            const SizedBox(height: 40),

                            // Save Button
                            if (profileProvider.isUpdating)
                              const CircularProgressIndicator()
                            else
                              TweenAnimationBuilder<double>(
                                tween: Tween(begin: 0.0, end: 1.0),
                                duration: const Duration(milliseconds: 400),
                                curve: Curves.easeOut,
                                builder: (context, value, child) {
                                  return Opacity(
                                    opacity: value,
                                    child: Transform.translate(
                                      offset: Offset(0, 20 * (1 - value)),
                                      child: child,
                                    ),
                                  );
                                },
                                child: SizedBox(
                                  width: double.infinity,
                                  height: 56,
                                  child: ElevatedButton(
                                    onPressed: _saveProfile,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor:
                                          AppColors.primaryGradient.first,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      elevation: 8,
                                    ),
                                    child: const Text(
                                      'حفظ التغييرات',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ),

                            const SizedBox(height: 20),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool enabled = true,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 10 * (1 - value)),
            child: child,
          ),
        );
      },
      child: TextFormField(
        controller: controller,
        enabled: enabled,
        keyboardType: keyboardType,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(
              color: Colors.grey[300]!,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(
              color: Colors.grey[300]!,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(
              color: AppColors.primaryGradient.first,
              width: 2,
            ),
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 16,
          ),
        ),
        onChanged: (_) {
          if (!_isEditing) {
            setState(() => _isEditing = true);
          }
        },
      ),
    );
  }
}
