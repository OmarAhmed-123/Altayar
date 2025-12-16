import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/chat/presentation/providers/chat_provider.dart';
import 'package:altayar/features/chat/presentation/widgets/chat_thread_list.dart';
import 'package:altayar/features/chat/presentation/widgets/message_bubble.dart';
import 'package:altayar/features/chat/presentation/widgets/message_input_bar.dart';
import 'package:altayar/features/chat/presentation/widgets/support_directory_sheet.dart';
import 'package:altayar/features/notifications/presentation/providers/notification_provider.dart';
import 'package:altayar/features/notifications/presentation/widgets/notification_center_sheet.dart';

class CommunicationPage extends StatefulWidget {
  const CommunicationPage({super.key});

  @override
  State<CommunicationPage> createState() => _CommunicationPageState();
}

class _CommunicationPageState extends State<CommunicationPage> {
  bool _showMessagesMobile = false;

  @override
  void initState() {
    super.initState();
    final chatProvider = context.read<ChatProvider>();
    chatProvider.initializeRealtime();
    final notificationProvider = context.read<NotificationProvider>();
    notificationProvider.initialize();
  }

  @override
  void dispose() {
    context.read<ChatProvider>().disposeRealtime();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();
    final notificationProvider = context.watch<NotificationProvider>();
    final isWide = MediaQuery.of(context).size.width > 900;
    return Scaffold(
      appBar: AppBar(
        leading: Navigator.of(context).canPop() ? const BackButton() : null,
        title: const Text(
          'مركز التواصل والدعم',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).primaryColor,
                Theme.of(context).primaryColor.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        actions: [
          Stack(
            children: [
              Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.2),
                ),
                child: IconButton(
                  icon: const Icon(
                    Icons.notifications_active_outlined,
                    color: Colors.white,
                  ),
                  onPressed: () => _openNotifications(context),
                ),
              ),
              if (notificationProvider.unreadCount > 0)
                Positioned(
                  right: 4,
                  top: 4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.redAccent,
                    ),
                    child: Text(
                      notificationProvider.unreadCount > 99
                          ? '99+'
                          : notificationProvider.unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (isWide) {
            return Row(
              children: [
                SizedBox(
                  width: constraints.maxWidth * 0.3,
                  child: ChatThreadList(
                    threads: chatProvider.threads,
                    selectedId: chatProvider.activeThread?.id,
                    onSelect: (thread) {
                      chatProvider.selectThread(thread);
                    },
                    onStartBot: chatProvider.startBotConversation,
                    onStartSupport: () => _openSupportDirectory(),
                    isLoading: chatProvider.isLoadingThreads,
                  ),
                ),
                const VerticalDivider(width: 1),
                Expanded(child: _buildChatWindow(chatProvider)),
              ],
            );
          }
          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: _showMessagesMobile
                ? _buildChatWindow(chatProvider, onBack: () {
                    setState(() => _showMessagesMobile = false);
                  })
                : ChatThreadList(
                    threads: chatProvider.threads,
                    selectedId: chatProvider.activeThread?.id,
                    onSelect: (thread) {
                      chatProvider.selectThread(thread);
                      setState(() => _showMessagesMobile = true);
                    },
                    onStartBot: chatProvider.startBotConversation,
                    onStartSupport: () => _openSupportDirectory(),
                    isLoading: chatProvider.isLoadingThreads,
                  ),
          );
        },
      ),
    );
  }

  Widget _buildChatWindow(
    ChatProvider provider, {
    VoidCallback? onBack,
  }) {
    final thread = provider.activeThread;
    if (thread == null) {
      return Container(
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
                size: 80,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 16),
              Text(
                'اختر محادثة للبدء',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'ابدأ محادثة جديدة أو اختر محادثة موجودة',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade500,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    // Get display name - use thread title which now contains the support agent name
    final displayName = thread.isBot ? 'الشات بوت' : thread.title;
    final subtitle = thread.isBot ? 'مساعد ذكي' : 'دردشة مباشرة';

    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).primaryColor.withOpacity(0.1),
                Colors.white,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            leading: onBack != null
                ? IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: onBack,
                    color: Theme.of(context).primaryColor,
                  )
                : Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: thread.isBot
                            ? [
                                Colors.deepPurple,
                                Colors.purple.shade300,
                              ]
                            : [
                                Theme.of(context).primaryColor,
                                Theme.of(context).primaryColor.withOpacity(0.7),
                              ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (thread.isBot
                                  ? Colors.deepPurple
                                  : Theme.of(context).primaryColor)
                              .withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: thread.avatarUrl != null &&
                            thread.avatarUrl!.isNotEmpty
                        ? CircleAvatar(
                            radius: 24,
                            backgroundImage: NetworkImage(thread.avatarUrl!),
                          )
                        : CircleAvatar(
                            radius: 24,
                            backgroundColor: Colors.transparent,
                            child: Icon(
                              thread.isBot ? Icons.smart_toy : Icons.person,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                  ),
            title: Text(
              displayName,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            subtitle: Row(
              children: [
                Icon(
                  thread.isBot ? Icons.smart_toy : Icons.support_agent,
                  size: 14,
                  color: Colors.grey.shade600,
                ),
                const SizedBox(width: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: provider.isLoadingMessages
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  reverse: false,
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.currentMessages.length,
                  itemBuilder: (context, index) =>
                      MessageBubble(message: provider.currentMessages[index]),
                ),
        ),
        const Divider(height: 1),
        MessageInputBar(
          isSending: provider.isSending,
          onSend: ({required String content, File? attachment}) {
            return provider.sendMessage(
              content: content,
              attachment: attachment,
            );
          },
          onBotAssist: thread.isBot
              ? () => provider.requestBotReply(
                    'ساعدني في ${provider.activeThread?.title}',
                  )
              : provider.startBotConversation,
        ),
      ],
    );
  }

  Future<void> _openSupportDirectory() async {
    final provider = context.read<ChatProvider>();
    await provider.loadSupportDirectory();
    if (!mounted) return;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: const SupportDirectorySheet(),
      ),
    );
  }

  Future<void> _openNotifications(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<NotificationProvider>(),
        child: const NotificationCenterSheet(),
      ),
    );
  }
}
