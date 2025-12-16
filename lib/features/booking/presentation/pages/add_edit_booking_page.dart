import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/booking/presentation/providers/booking_provider.dart';
import 'package:altayar/features/booking/data/models/booking.dart';
import 'package:altayar/features/auth/presentation/providers/auth_provider.dart';

class AddEditBookingPage extends StatefulWidget {
  const AddEditBookingPage({
    super.key,
    this.booking,
    required this.onSave,
  });

  final BookingModel? booking;
  final Function(BookingModel) onSave;

  @override
  State<AddEditBookingPage> createState() => _AddEditBookingPageState();
}

class _AddEditBookingPageState extends State<AddEditBookingPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _customerNameController;
  late TextEditingController _customerEmailController;
  late TextEditingController _totalPriceController;
  late TextEditingController _specialRequestsController;
  late TextEditingController _startDateController;
  late TextEditingController _endDateController;

  BookingCategory _selectedCategory = BookingCategory.generalTour;
  DateTime? _startDate;
  DateTime? _endDate;
  int? _selectedUserId;

  @override
  void initState() {
    super.initState();
    _customerNameController = TextEditingController(
      text: widget.booking?.customerName ?? '',
    );
    _customerEmailController = TextEditingController(
      text: widget.booking?.customerEmail ?? '',
    );
    _totalPriceController = TextEditingController(
      text: widget.booking?.totalPrice.toStringAsFixed(0) ?? '0',
    );
    _specialRequestsController = TextEditingController(
      text: widget.booking?.specialRequests ?? '',
    );
    _startDateController = TextEditingController();
    _endDateController = TextEditingController();

    if (widget.booking != null) {
      _selectedCategory = widget.booking!.category;
      _startDate = widget.booking!.startDate;
      _endDate = widget.booking!.endDate;
      _selectedUserId = widget.booking!.userId;

      if (_startDate != null) {
        _startDateController.text =
            DateFormat('yyyy-MM-dd').format(_startDate!);
      }
      if (_endDate != null) {
        _endDateController.text = DateFormat('yyyy-MM-dd').format(_endDate!);
      }
    }
  }

  @override
  void dispose() {
    _customerNameController.dispose();
    _customerEmailController.dispose();
    _totalPriceController.dispose();
    _specialRequestsController.dispose();
    _startDateController.dispose();
    _endDateController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(
    BuildContext context,
    bool isStartDate,
  ) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStartDate
          ? (_startDate ?? DateTime.now())
          : (_endDate ?? _startDate ?? DateTime.now()),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        if (isStartDate) {
          _startDate = picked;
          _startDateController.text = DateFormat('yyyy-MM-dd').format(picked);
          if (_endDate != null && _endDate!.isBefore(picked)) {
            _endDate = null;
            _endDateController.clear();
          }
        } else {
          if (_startDate != null && picked.isBefore(_startDate!)) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تاريخ النهاية يجب أن يكون بعد تاريخ البداية'),
                backgroundColor: Colors.red,
              ),
            );
            return;
          }
          _endDate = picked;
          _endDateController.text = DateFormat('yyyy-MM-dd').format(picked);
        }
      });
    }
  }

  Future<void> _saveForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final provider = context.read<BookingProvider>();
    final authProvider = context.read<AuthProvider>();

    final payload = <String, dynamic>{
      'bookingType': _getBookingTypeString(_selectedCategory),
      'totalPrice': double.tryParse(_totalPriceController.text) ?? 0,
      'customerName': _customerNameController.text.trim(),
      'customerEmail': _customerEmailController.text.trim(),
      'details': {
        'participants': 1,
        'startDate': _startDate?.toIso8601String(),
        'endDate': _endDate?.toIso8601String(),
        'specialRequests': _specialRequestsController.text.trim(),
      },
      'userId': _selectedUserId ?? authProvider.currentUser?.id,
    };

    if (widget.booking == null) {
      // Create new booking
      final success = await provider.createBookingByAdmin(payload);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم إضافة الحجز بنجاح'),
              backgroundColor: Colors.green,
            ),
          );
          widget.onSave(provider.adminBookings.first);
          Navigator.of(context).pop();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                provider.errorMessage ?? 'فشل إضافة الحجز',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } else {
      // Update existing booking - Note: Update functionality would need to be added to the API
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تحديث الحجز غير متاح حالياً'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  String _getBookingTypeString(BookingCategory category) {
    switch (category) {
      case BookingCategory.tour:
        return 'tour';
      case BookingCategory.nileCruise:
        return 'nile_cruise';
      case BookingCategory.flightTicket:
        return 'flight_ticket';
      case BookingCategory.hotelBooking:
        return 'hotel_booking';
      case BookingCategory.transfer:
        return 'transfer';
      case BookingCategory.nileTrip:
        return 'nile_trip';
      case BookingCategory.generalTour:
        return 'general_tour';
      case BookingCategory.customRequest:
        return 'custom_request';
    }
  }

  String _getCategoryLabel(BookingCategory category) {
    switch (category) {
      case BookingCategory.tour:
        return 'جولة';
      case BookingCategory.nileCruise:
        return 'رحلة نيلية';
      case BookingCategory.flightTicket:
        return 'تذكرة طيران';
      case BookingCategory.hotelBooking:
        return 'حجز فندق';
      case BookingCategory.transfer:
        return 'نقل';
      case BookingCategory.nileTrip:
        return 'رحلة نيلية';
      case BookingCategory.generalTour:
        return 'جولة عامة';
      case BookingCategory.customRequest:
        return 'طلب مخصص';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.booking == null ? 'إضافة حجز جديد' : 'تعديل الحجز'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Customer Name
            TextFormField(
              controller: _customerNameController,
              decoration: const InputDecoration(
                labelText: 'اسم العميل',
                prefixIcon: Icon(Icons.person),
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'يرجى إدخال اسم العميل';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Customer Email
            TextFormField(
              controller: _customerEmailController,
              decoration: const InputDecoration(
                labelText: 'البريد الإلكتروني',
                prefixIcon: Icon(Icons.email),
                border: OutlineInputBorder(),
              ),
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
            const SizedBox(height: 16),

            // Booking Category
            DropdownButtonFormField<BookingCategory>(
              value: _selectedCategory,
              decoration: const InputDecoration(
                labelText: 'نوع الحجز',
                prefixIcon: Icon(Icons.category),
                border: OutlineInputBorder(),
              ),
              items: BookingCategory.values.map((category) {
                return DropdownMenuItem(
                  value: category,
                  child: Text(_getCategoryLabel(category)),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedCategory = value);
                }
              },
            ),
            const SizedBox(height: 16),

            // Total Price
            TextFormField(
              controller: _totalPriceController,
              decoration: const InputDecoration(
                labelText: 'المبلغ الإجمالي (EGP)',
                prefixIcon: Icon(Icons.attach_money),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'يرجى إدخال المبلغ';
                }
                final price = double.tryParse(value);
                if (price == null || price < 0) {
                  return 'يرجى إدخال مبلغ صحيح';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Start Date
            TextFormField(
              controller: _startDateController,
              decoration: const InputDecoration(
                labelText: 'تاريخ البداية',
                prefixIcon: Icon(Icons.calendar_today),
                border: OutlineInputBorder(),
              ),
              readOnly: true,
              onTap: () => _selectDate(context, true),
            ),
            const SizedBox(height: 16),

            // End Date
            TextFormField(
              controller: _endDateController,
              decoration: const InputDecoration(
                labelText: 'تاريخ النهاية',
                prefixIcon: Icon(Icons.event_available),
                border: OutlineInputBorder(),
              ),
              readOnly: true,
              onTap: () => _selectDate(context, false),
            ),
            const SizedBox(height: 16),

            // Special Requests
            TextFormField(
              controller: _specialRequestsController,
              decoration: const InputDecoration(
                labelText: 'طلبات خاصة (اختياري)',
                prefixIcon: Icon(Icons.note),
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),

            // Save Button
            FilledButton(
              onPressed: _saveForm,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppColors.primary,
              ),
              child: Consumer<BookingProvider>(
                builder: (context, provider, _) {
                  if (provider.isCreating) {
                    return const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    );
                  }
                  return Text(
                    widget.booking == null ? 'إضافة الحجز' : 'حفظ التعديلات',
                    style: const TextStyle(fontSize: 16),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
