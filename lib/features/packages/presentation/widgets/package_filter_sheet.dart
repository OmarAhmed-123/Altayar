import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/packages/presentation/providers/package_provider.dart';

class PackageFilterSheet extends StatefulWidget {
  const PackageFilterSheet({super.key});

  @override
  State<PackageFilterSheet> createState() => _PackageFilterSheetState();
}

class _PackageFilterSheetState extends State<PackageFilterSheet> {
  late TextEditingController _priceController;
  late TextEditingController _durationController;
  String? _destination;

  @override
  void initState() {
    super.initState();
    final provider = context.read<PackageProvider>();
    _priceController = TextEditingController(
      text: provider.maxPrice?.toString() ?? '',
    );
    _durationController = TextEditingController(
      text: provider.maxDurationDays?.toString() ?? '',
    );
    _destination = provider.destination;
  }

  @override
  void dispose() {
    _priceController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PackageProvider>();
    final destinations = {
      for (final pkg in provider.packages)
        if (pkg.destination != null && pkg.destination!.isNotEmpty)
          pkg.destination!
    }.toList();
    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(const EdgeInsets.all(24)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'الفلاتر المتقدمة',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _destination?.isEmpty ?? true ? null : _destination,
            decoration: const InputDecoration(
              labelText: 'الوجهة',
            ),
            items: destinations
                .map(
                  (dest) => DropdownMenuItem(
                    value: dest,
                    child: Text(dest),
                  ),
                )
                .toList(),
            onChanged: (value) => setState(() {
              _destination = value;
            }),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _priceController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'أقصى سعر (EGP)',
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _durationController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'أقصى مدة (أيام)',
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () {
              provider.setDestination(_destination);
              provider.setMaxPrice(
                double.tryParse(_priceController.text.trim()),
              );
              provider.setMaxDuration(
                int.tryParse(_durationController.text.trim()),
              );
              Navigator.of(context).pop();
            },
            child: const Text('تطبيق الفلاتر'),
          ),
        ],
      ),
    );
  }
}
