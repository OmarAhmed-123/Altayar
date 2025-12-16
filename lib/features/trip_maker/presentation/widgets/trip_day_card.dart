import 'package:flutter/material.dart';

import 'package:altayar/features/trip_maker/presentation/providers/trip_maker_provider.dart';
import 'package:altayar/features/trip_maker/data/models/trip_plan.dart';

class TripDayCard extends StatefulWidget {
  const TripDayCard({
    super.key,
    required this.plan,
    required this.onDestinationChanged,
    required this.onHotelChanged,
    required this.onTransportChanged,
    required this.onActivitiesChanged,
  });

  final TripDayPlan plan;
  final ValueChanged<String?> onDestinationChanged;
  final ValueChanged<String?> onHotelChanged;
  final ValueChanged<String?> onTransportChanged;
  final ValueChanged<List<String>> onActivitiesChanged;

  @override
  State<TripDayCard> createState() => _TripDayCardState();
}

class _TripDayCardState extends State<TripDayCard> {
  late List<String> _selectedActivities;

  @override
  void initState() {
    super.initState();
    _selectedActivities = widget.plan.activities;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'اليوم ${widget.plan.dayNumber}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: widget.plan.destination,
              decoration: const InputDecoration(labelText: 'الوجهة'),
              items: TripMakerProvider.destinations
                  .map(
                    (value) => DropdownMenuItem(
                      value: value,
                      child: Text(value),
                    ),
                  )
                  .toList(),
              onChanged: widget.onDestinationChanged,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: widget.plan.hotel,
              decoration: const InputDecoration(labelText: 'الفندق'),
              items: TripMakerProvider.hotels
                  .map(
                    (value) => DropdownMenuItem(
                      value: value,
                      child: Text(value),
                    ),
                  )
                  .toList(),
              onChanged: widget.onHotelChanged,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: widget.plan.transport,
              decoration: const InputDecoration(labelText: 'وسيلة النقل'),
              items: TripMakerProvider.transports
                  .map(
                    (value) => DropdownMenuItem(
                      value: value,
                      child: Text(value),
                    ),
                  )
                  .toList(),
              onChanged: widget.onTransportChanged,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: TripMakerProvider.activities.map((activity) {
                final selected = _selectedActivities.contains(activity);
                return FilterChip(
                  label: Text(activity),
                  selected: selected,
                  onSelected: (value) {
                    setState(() {
                      if (value) {
                        _selectedActivities = [
                          ..._selectedActivities,
                          activity,
                        ];
                      } else {
                        _selectedActivities = _selectedActivities
                            .where((item) => item != activity)
                            .toList();
                      }
                      widget.onActivitiesChanged(_selectedActivities);
                    });
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
