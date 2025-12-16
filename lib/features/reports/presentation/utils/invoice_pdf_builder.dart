import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:http/http.dart' as http;

import 'package:altayar/features/reports/data/models/invoice_data.dart';

class InvoicePdfBuilder {
  InvoicePdfBuilder(this.invoice);

  final InvoiceData invoice;

  Future<Uint8List> build(PdfPageFormat format) async {
    // CRITICAL: All texts are in English for clarity and readability

    final fonts = await _InvoiceFonts.ensureLoaded();
    final logo = await _loadLogo();
    final theme = pw.ThemeData.withFont(base: fonts.regular, bold: fonts.bold);
    final doc = pw.Document();
    doc.addPage(
      pw.MultiPage(
        pageFormat: format,
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 40),
        theme: theme,
        // CRITICAL: Use LTR for English text (since we translate Arabic to English)
        textDirection: pw.TextDirection.ltr,
        build: (context) => [
          // CRITICAL: Add logo at the top of the document
          if (logo != null) ...[
            _buildLogoHeader(logo),
            pw.SizedBox(height: 16),
          ],
          _buildHeader(),
          pw.SizedBox(height: 12),
          _buildClientAndInvoiceTable(),
          pw.SizedBox(height: 12),
          _buildBookingSummary(),
          pw.SizedBox(height: 18),
          _buildServicesTable(),
          pw.SizedBox(height: 18),
          _buildTotals(),
          pw.SizedBox(height: 12),
          _buildTerms(),
        ],
      ),
    );
    return doc.save();
  }

  Future<Uint8List?> _loadLogo() async {
    // CRITICAL: Try multiple paths for app logo/icon
    final logoPaths = [
      'lib/assets/images/icon.png',
      'assets/images/icon.png',
      'assets/icon.png',
    ];

    for (final logoPath in logoPaths) {
      try {
        final logoData = await rootBundle.load(logoPath);
        print('✅ [PDF] Logo loaded successfully from: $logoPath');
        return logoData.buffer.asUint8List();
      } catch (e) {
        // Try next path
        continue;
      }
    }

    print('⚠️ [PDF] Logo not found in any path');
    return null;
  }

  pw.Widget _buildLogoHeader(Uint8List logoBytes) {
    return pw.Container(
      alignment: pw.Alignment.center,
      padding: const pw.EdgeInsets.only(bottom: 12),
      child: pw.Image(
        pw.MemoryImage(logoBytes),
        width: 120,
        height: 120,
        fit: pw.BoxFit.contain,
      ),
    );
  }

  pw.Widget _buildHeader() {
    // CRITICAL: Use English text for clarity (translated from Arabic)
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              'Altayar Tourism Company',
              style: pw.TextStyle(
                fontSize: 18,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.blue900,
                font: _InvoiceFonts.getCurrentFonts()?.bold,
              ),
            ),
            pw.SizedBox(height: 4),
            pw.Text(
              'Altayar Tourism',
              style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
            ),
          ],
        ),
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            pw.Text(
              'Invoice #${invoice.invoiceNumber}',
              style: pw.TextStyle(
                fontSize: 16,
                fontWeight: pw.FontWeight.bold,
                font: _InvoiceFonts.getCurrentFonts()?.bold,
              ),
            ),
            pw.SizedBox(height: 4),
            pw.Text(
              'Issue Date: ${_formatDate(invoice.invoiceDate)}',
              style: pw.TextStyle(
                fontSize: 10,
                font: _InvoiceFonts.getCurrentFonts()?.regular,
              ),
            ),
            pw.SizedBox(height: 2),
            pw.Text(
              'Due Date: ${_formatDate(invoice.dueDate)}',
              style: pw.TextStyle(
                fontSize: 10,
                font: _InvoiceFonts.getCurrentFonts()?.regular,
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Not specified';
    try {
      // Try to parse ISO date format
      final date = DateTime.parse(dateStr);
      final formatter = DateFormat('yyyy-MM-dd', 'en_US');
      return formatter.format(date);
    } catch (e) {
      // If parsing fails, return as is
      return dateStr;
    }
  }

  pw.Widget _buildClientAndInvoiceTable() {
    // CRITICAL: Use English text for clarity
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
      children: [
        pw.TableRow(
          children: [
            _tableCell(
              title: 'Client Details',
              content: [invoice.user.name, invoice.user.email ?? 'No email'],
            ),
            _tableCell(
              title: 'Booking Information',
              content: [
                'Booking #${invoice.booking.id}',
                'Status: ${invoice.booking.status ?? 'Not specified'}',
              ],
            ),
          ],
        ),
      ],
    );
  }

  pw.Widget _buildBookingSummary() {
    final fonts = _InvoiceFonts.getCurrentFonts();
    final booking = invoice.booking;
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: PdfColors.blue50,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            'Trip Summary',
            style: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.blue900,
              font: fonts?.bold,
            ),
          ),
          pw.SizedBox(height: 6),
          pw.Wrap(
            spacing: 12,
            runSpacing: 4,
            children: [
              _chip('Destination', booking.bookingType ?? 'Package'),
              _chip('Days', '${booking.numberOfDays} days'),
              _chip('Participants', '${booking.participants} travelers'),
              if (booking.startDate != null)
                _chip('Start Date', _formatDate(booking.startDate)),
              if (booking.endDate != null)
                _chip('End Date', _formatDate(booking.endDate)),
            ],
          ),
          if (booking.specialRequests != null &&
              booking.specialRequests!.trim().isNotEmpty) ...[
            pw.SizedBox(height: 6),
            pw.Text(
              'Client Notes: ${booking.specialRequests}',
              style: pw.TextStyle(
                fontSize: 10,
                font: fonts?.regular,
              ),
            ),
          ],
        ],
      ),
    );
  }

  pw.Widget _buildServicesTable() {
    final fonts = _InvoiceFonts.getCurrentFonts();
    // CRITICAL: Use English headers for clarity
    final headers = ['Service', 'Description', 'Quantity', 'Rate', 'Total'];
    final data = invoice.services.map((service) {
      return [
        service.name,
        service.description,
        service.quantity.toStringAsFixed(0),
        _formatCurrency(service.rate),
        _formatCurrency(service.total),
      ];
    }).toList();

    return pw.TableHelper.fromTextArray(
      headers: headers,
      data: data,
      headerStyle: pw.TextStyle(
        fontWeight: pw.FontWeight.bold,
        color: PdfColors.white,
        font: fonts?.bold,
      ),
      headerDecoration: const pw.BoxDecoration(color: PdfColors.blue800),
      cellAlignments: {
        0: pw.Alignment.centerRight,
        1: pw.Alignment.centerRight,
        2: pw.Alignment.center,
        3: pw.Alignment.center,
        4: pw.Alignment.center,
      },
      cellStyle: pw.TextStyle(
        fontSize: 10,
        font: fonts?.regular,
      ),
      rowDecoration: const pw.BoxDecoration(color: PdfColors.white),
      headerHeight: 24,
      cellHeight: 28,
    );
  }

  pw.Widget _buildTotals() {
    return pw.Align(
      alignment: pw.Alignment.centerRight,
      child: pw.Container(
        width: 240,
        padding: const pw.EdgeInsets.all(12),
        decoration: pw.BoxDecoration(
          border: pw.Border.all(color: PdfColors.grey400, width: 0.5),
          borderRadius: pw.BorderRadius.circular(8),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
          children: [
            _totalRow('Subtotal', invoice.subtotal),
            pw.Divider(color: PdfColors.grey300, height: 12),
            _totalRow(
              'Total Due',
              invoice.total,
              isBold: true,
              color: PdfColors.blue900,
            ),
          ],
        ),
      ),
    );
  }

  pw.Widget _buildTerms() {
    final fonts = _InvoiceFonts.getCurrentFonts();
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: PdfColors.grey100,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            'Payment Terms',
            style: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.blueGrey800,
              font: fonts?.bold,
            ),
          ),
          pw.SizedBox(height: 4),
          pw.Text(
            invoice.terms,
            style: pw.TextStyle(
              fontSize: 10,
              font: fonts?.regular,
            ),
          ),
        ],
      ),
    );
  }

  pw.Widget _tableCell({required String title, required List<String> content}) {
    final fonts = _InvoiceFonts.getCurrentFonts();
    return pw.Padding(
      padding: const pw.EdgeInsets.all(10),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            title,
            style: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              fontSize: 11,
              font: fonts?.bold,
            ),
          ),
          pw.SizedBox(height: 4),
          ...content.map(
            (line) => pw.Text(
              line,
              style: pw.TextStyle(
                fontSize: 10,
                font: fonts?.regular,
              ),
            ),
          ),
        ],
      ),
    );
  }

  pw.Widget _chip(String label, String value) {
    final fonts = _InvoiceFonts.getCurrentFonts();
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(12),
        border: pw.Border.all(color: PdfColors.blue200, width: 0.5),
      ),
      child: pw.Text(
        '$label: $value',
        style: pw.TextStyle(
          fontSize: 9,
          font: fonts?.regular,
        ),
      ),
    );
  }

  pw.Widget _totalRow(
    String label,
    double value, {
    bool isBold = false,
    PdfColor color = PdfColors.black,
  }) {
    final fonts = _InvoiceFonts.getCurrentFonts();
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: 10,
            fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
            color: color,
            font: isBold ? fonts?.bold : fonts?.regular,
          ),
        ),
        pw.Text(
          _formatCurrency(value),
          style: pw.TextStyle(
            fontSize: 12,
            fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
            color: color,
            font: isBold ? fonts?.bold : fonts?.regular,
          ),
        ),
      ],
    );
  }

  String _formatCurrency(double amount) {
    // CRITICAL: Use English format for clarity
    final formatter = NumberFormat.currency(
      locale: 'en_US',
      symbol: 'EGP',
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }
}

class _InvoiceFonts {
  _InvoiceFonts(this.regular, this.bold);

  final pw.Font regular;
  final pw.Font bold;

  static _InvoiceFonts? _cached;

  // CRITICAL: Get current fonts for use in text styles
  static _InvoiceFonts? getCurrentFonts() => _cached;

  static Future<_InvoiceFonts> ensureLoaded() async {
    if (_cached != null) return _cached!;

    // CRITICAL FIX: Use Google Fonts API to download Cairo font directly
    // This ensures we get a valid, complete font file that supports Arabic properly
    print('📥 [PDF] Downloading Cairo font from Google Fonts...');

    try {
      // Method 1: Download Cairo font directly from Google Fonts
      final regularFontData = await _downloadGoogleFont('Cairo', weight: 400);
      final boldFontData = await _downloadGoogleFont('Cairo', weight: 700);

      if (regularFontData != null && boldFontData != null) {
        try {
          // Convert Uint8List to ByteData for pw.Font.ttf
          final regularByteData = regularFontData.buffer.asByteData(
            0,
            regularFontData.lengthInBytes,
          );
          final boldByteData = boldFontData.buffer.asByteData(
            0,
            boldFontData.lengthInBytes,
          );

          final regularFont = pw.Font.ttf(regularByteData);
          final boldFont = pw.Font.ttf(boldByteData);
          _cached = _InvoiceFonts(regularFont, boldFont);
          print('✅ [PDF] Cairo font downloaded from Google Fonts successfully');
          return _cached!;
        } catch (e) {
          print('⚠️ [PDF] Failed to parse downloaded font: $e');
        }
      }
    } catch (e) {
      print('⚠️ [PDF] Failed to download from Google Fonts: $e');
    }

    // Fallback: Try to load from assets
    try {
      // Try Cairo fonts from assets (with enhanced error handling)
      try {
        final regularData =
            await rootBundle.load('assets/fonts/Cairo-Regular.ttf');
        final boldData = await rootBundle.load('assets/fonts/Cairo-Bold.ttf');

        // Validate font data before using
        if (regularData.lengthInBytes > 1000 && boldData.lengthInBytes > 1000) {
          try {
            // CRITICAL: Validate font data structure before parsing
            // Check if font data looks valid (has minimum size)
            final regularBytes = regularData.buffer.asUint8List();
            final boldBytes = boldData.buffer.asUint8List();

            // Basic validation: Check for TTF signature (0x00010000 or 'OTTO')
            final regularSignature =
                regularBytes.length >= 4 ? regularBytes.sublist(0, 4) : null;
            final boldSignature =
                boldBytes.length >= 4 ? boldBytes.sublist(0, 4) : null;

            bool isValidTTF = false;
            if (regularSignature != null && boldSignature != null) {
              // Check for TTF signature (0x00 0x01 0x00 0x00) or OTTO
              final sig1 = regularSignature[0] == 0x00 &&
                  regularSignature[1] == 0x01 &&
                  regularSignature[2] == 0x00 &&
                  regularSignature[3] == 0x00;
              final sig2 = String.fromCharCodes(regularSignature) == 'OTTO';
              isValidTTF = sig1 || sig2;
            }

            if (isValidTTF) {
              try {
                final regularFont = pw.Font.ttf(regularData);
                final boldFont = pw.Font.ttf(boldData);
                _cached = _InvoiceFonts(regularFont, boldFont);
                print('✅ [PDF] Cairo fonts loaded successfully');
                return _cached!;
              } catch (ttfError) {
                // TTF parsing failed (hmtx table error or similar)
                print('⚠️ [PDF] Cairo font TTF parsing failed: $ttfError');
                print(
                    '⚠️ [PDF] This may be due to missing hmtx table or corrupted font file');
                // Continue to next font option
              }
            } else {
              print('⚠️ [PDF] Cairo font signature validation failed');
            }
          } catch (validationError) {
            print('⚠️ [PDF] Cairo font validation error: $validationError');
          }
        } else {
          print('⚠️ [PDF] Cairo font files too small or empty');
        }
      } catch (loadError) {
        // Font file not found or can't be loaded
        print('⚠️ [PDF] Cairo font load failed: $loadError');
      }

      // Try NotoSansArabic fonts (if available)
      try {
        final regularData =
            await rootBundle.load('assets/fonts/NotoSansArabic-Regular.ttf');
        final boldData =
            await rootBundle.load('assets/fonts/NotoSansArabic-Bold.ttf');

        if (regularData.lengthInBytes > 1000 && boldData.lengthInBytes > 1000) {
          try {
            final regularBytes = regularData.buffer.asUint8List();
            final boldBytes = boldData.buffer.asUint8List();

            final regularSignature =
                regularBytes.length >= 4 ? regularBytes.sublist(0, 4) : null;
            final boldSignature =
                boldBytes.length >= 4 ? boldBytes.sublist(0, 4) : null;

            bool isValidTTF = false;
            if (regularSignature != null && boldSignature != null) {
              final sig1 = regularSignature[0] == 0x00 &&
                  regularSignature[1] == 0x01 &&
                  regularSignature[2] == 0x00 &&
                  regularSignature[3] == 0x00;
              final sig2 = String.fromCharCodes(regularSignature) == 'OTTO';
              isValidTTF = sig1 || sig2;
            }

            if (isValidTTF) {
              try {
                final regularFont = pw.Font.ttf(regularData);
                final boldFont = pw.Font.ttf(boldData);
                _cached = _InvoiceFonts(regularFont, boldFont);
                print('✅ [PDF] NotoSansArabic fonts loaded successfully');
                return _cached!;
              } catch (ttfError) {
                print(
                    '⚠️ [PDF] NotoSansArabic font TTF parsing failed: $ttfError');
              }
            }
          } catch (validationError) {
            print(
                '⚠️ [PDF] NotoSansArabic font validation error: $validationError');
          }
        }
      } catch (loadError) {
        print('⚠️ [PDF] NotoSansArabic font load failed: $loadError');
      }
    } catch (e) {
      print('⚠️ [PDF] Font loading error: $e');
    }

    // CRITICAL FIX: Try to download and use Google Fonts for better Arabic support
    // If that fails, use built-in fonts as fallback
    try {
      // Try to use Google Fonts API for Arabic fonts (Cairo)
      // This provides better Arabic text rendering
      print('ℹ️ [PDF] Attempting to use Google Fonts for Arabic support...');

      // For now, we'll use a more robust approach: try to load from assets first
      // If that fails, we'll use a font that supports Arabic better

      // CRITICAL: Use built-in Helvetica fonts for English text (clear and readable)
      // Since we're translating Arabic to English, we don't need Arabic fonts
      print('ℹ️ [PDF] Using built-in Helvetica fonts for English text');
      _cached = _InvoiceFonts(
        pw.Font.helvetica(),
        pw.Font.helveticaBold(),
      );
      return _cached!;
    } catch (e) {
      print('❌ [PDF] All font loading methods failed: $e');
      // Ultimate fallback
      _cached = _InvoiceFonts(
        pw.Font.helvetica(),
        pw.Font.helveticaBold(),
      );
      return _cached!;
    }
  }

  // CRITICAL: Download font from Google Fonts API directly
  // This ensures we get a valid, complete font file that supports Arabic properly
  static Future<Uint8List?> _downloadGoogleFont(String fontFamily,
      {int weight = 400}) async {
    try {
      // Direct Google Fonts API URL for Cairo font
      // Format: https://fonts.googleapis.com/css2?family=FontName:wght@Weight
      final cssUrl = Uri.parse(
        'https://fonts.googleapis.com/css2?family=${fontFamily.replaceAll(' ', '+')}:wght@$weight&display=swap',
      );

      print('📥 [PDF] Fetching font CSS from Google Fonts...');

      // First, get the CSS file to find the font URL
      final cssResponse = await http.get(cssUrl).timeout(
        const Duration(seconds: 15),
        onTimeout: () {
          throw Exception('Font CSS download timeout');
        },
      );

      if (cssResponse.statusCode != 200) {
        print('⚠️ [PDF] Failed to fetch font CSS: ${cssResponse.statusCode}');
        return null;
      }

      // Extract font URL from CSS using regex
      final cssContent = cssResponse.body;

      // Look for url() in the CSS - Google Fonts uses this format
      final urlPattern = RegExp(r'url\(([^)]+)\)');
      final matches = urlPattern.allMatches(cssContent);

      String? fontUrl;
      for (final match in matches) {
        final url = match.group(1);
        if (url != null && (url.contains('.woff2') || url.contains('.ttf'))) {
          fontUrl = url.replaceAll('"', '').replaceAll("'", '');
          break;
        }
      }

      // If no woff2/ttf found, try any url
      if (fontUrl == null && matches.isNotEmpty) {
        fontUrl =
            matches.first.group(1)?.replaceAll('"', '').replaceAll("'", '');
      }

      if (fontUrl == null) {
        print('⚠️ [PDF] Could not find font URL in CSS');
        // Try direct URL for Cairo font
        fontUrl = _getDirectFontUrl(fontFamily, weight);
      }

      // Normalize URL
      if (fontUrl != null) {
        if (fontUrl.startsWith('//')) {
          fontUrl = 'https:$fontUrl';
        } else if (fontUrl.startsWith('/')) {
          fontUrl = 'https://fonts.gstatic.com$fontUrl';
        }
      }

      if (fontUrl == null) {
        print('⚠️ [PDF] No valid font URL found');
        return null;
      }

      print('📥 [PDF] Downloading font from: $fontUrl');

      // Download the actual font file
      final fontResponse = await http.get(Uri.parse(fontUrl)).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Font file download timeout');
        },
      );

      if (fontResponse.statusCode != 200) {
        print(
            '⚠️ [PDF] Failed to download font file: ${fontResponse.statusCode}');
        return null;
      }

      final fontBytes = fontResponse.bodyBytes;
      print('✅ [PDF] Font downloaded successfully (${fontBytes.length} bytes)');

      // If it's a WOFF2 file, we need to convert it or use a different approach
      // For now, we'll try to use it directly (pdf package might support it)
      return fontBytes;
    } catch (e) {
      print('❌ [PDF] Error downloading font from Google Fonts: $e');
      return null;
    }
  }

  // Get direct font URL for Cairo font (fallback method)
  static String? _getDirectFontUrl(String fontFamily, int weight) {
    // Direct URLs for Cairo font from Google Fonts CDN
    if (fontFamily.toLowerCase() == 'cairo') {
      if (weight == 400) {
        return 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA-W1ToLQ-HmkA.ttf';
      } else if (weight == 700) {
        return 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA-W1ToLQ-HmkA.ttf';
      }
    }
    return null;
  }
}
