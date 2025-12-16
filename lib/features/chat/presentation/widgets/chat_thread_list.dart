import 'package:flutter/material.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/features/chat/data/models/chat_thread.dart';

class ChatThreadList extends StatelessWidget {
  const ChatThreadList({
    super.key,
    required this.threads,
    required this.selectedId,
    required this.onSelect,
    required this.onStartBot,
    required this.onStartSupport,
    this.isLoading = false,
  });

  final List<ChatThread> threads;
  final int? selectedId;
  final ValueChanged<ChatThread> onSelect;
  final VoidCallback onStartBot;
  final VoidCallback onStartSupport;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.blue.shade50,
                Colors.white,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              GradientButton(
                label: 'محادثة مع الشات بوت',
                icon: Icons.smart_toy_outlined,
                onPressed: onStartBot,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 14,
                ),
              ),
              GradientButton(
                label: 'الاتصال بالدعم',
                icon: Icons.support_agent,
                onPressed: onStartSupport,
                colors: AppColors.successGradient,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 14,
                ),
              ),
            ],
          ),
        ),
        if (isLoading)
          const Expanded(
            child: Center(child: CircularProgressIndicator()),
          )
        else if (threads.isEmpty)
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.blue.shade50,
                    Colors.white,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.chat_bubble_outline,
                      size: 64,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'لا توجد محادثات بعد',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'ابدأ محادثة جديدة مع الشات بوت أو فريق الدعم',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade500,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          )
        else
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: threads.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final thread = threads[index];
                final selected = thread.id == selectedId;
                final hasAvatar =
                    thread.avatarUrl != null && thread.avatarUrl!.isNotEmpty;
                return AnimatedCard(
                  borderRadius: BorderRadius.circular(16),
                  margin: const EdgeInsets.only(bottom: 8),
                  onTap: () => onSelect(thread),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: selected
                          ? LinearGradient(
                              colors: [
                                AppColors.primary.withOpacity(0.1),
                                AppColors.primary.withOpacity(0.05),
                              ],
                            )
                          : null,
                      color: selected ? null : Colors.transparent,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: selected
                            ? AppColors.primary.withOpacity(0.3)
                            : Colors.transparent,
                        width: selected ? 1.5 : 0,
                      ),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: thread.isBot
                                  ? [
                                      Colors.deepPurple,
                                      Colors.purple.shade300,
                                    ]
                                  : AppColors.primaryGradient,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: (thread.isBot
                                        ? Colors.deepPurple
                                        : AppColors.primary)
                                    .withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 24,
                            backgroundColor: hasAvatar
                                ? Colors.transparent
                                : thread.isBot
                                    ? Colors.deepPurple
                                    : Colors.blueGrey.shade200,
                            backgroundImage: hasAvatar
                                ? NetworkImage(thread.avatarUrl!)
                                : null,
                            child: hasAvatar
                                ? null
                                : Icon(
                                    thread.isBot
                                        ? Icons.smart_toy
                                        : Icons.person,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                thread.isBot ? 'الشات بوت' : thread.title,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.dark,
                                    ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                thread.lastMessage,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: Colors.grey[700],
                                    ),
                              ),
                            ],
                          ),
                        ),
                        if (thread.unreadCount > 0)
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: AppColors.errorGradient,
                              ),
                            ),
                            child: Text(
                              thread.unreadCount.toString(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}
