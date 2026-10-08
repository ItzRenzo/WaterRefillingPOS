import { useEffect, useRef, useState } from "react";
import Svg, { Path } from "react-native-svg";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { api, isUnauthorized } from "@/api";

type Message = { role: "user" | "assistant"; content: string };
const SUGGESTIONS = [
  "Which products need restocking?",
  "Summarize today's sales",
  "How do I use the POS?",
];

export default function ChatAssistant({
  onUnauthorized,
  compact = false,
}: {
  onUnauthorized: () => Promise<void>;
  compact?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  useEffect(() => () => request.current?.abort(), []);

  function clearChat() {
    request.current?.abort();
    request.current = null;
    setMessages([]);
    setDraft("");
    setError("");
    setBusy(false);
    input.current?.focus();
  }

  async function send(text = draft, retry = false) {
    const content = text.trim();
    if (!content || content.length > 2000 || request.current) return;
    const previous = error ? messages.slice(0, -1) : messages;
    const next: Message[] = [...previous, { role: "user", content }];
    const controller = new AbortController();
    request.current = controller;
    setMessages(next);
    if (!retry) setDraft("");
    setBusy(true);
    setError("");
    try {
      const result = await api<{ reply: string }>(
        "/chat",
        {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            message: content,
            history: previous.slice(-12),
          }),
        },
        undefined,
        40_000,
      );
      if (request.current !== controller) return;
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch (failure) {
      if (request.current !== controller) return;
      if (isUnauthorized(failure)) {
        await onUnauthorized();
        return;
      }
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to send your message. Please try again.",
      );
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <>
      {compact ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open AI assistant"
          onPress={() => setOpen(true)}
          style={styles.compactLauncher}
        >
          <Text style={styles.compactLabel}>AI</Text>
        </Pressable>
      ) : (
        <View
          style={[
            styles.launcherBar,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open AI assistant"
            onPress={() => setOpen(true)}
            style={({ pressed }) => [
              styles.launcher,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AI</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.launcherTitle}>Ask RJane Assistant</Text>
              <Text style={styles.launcherSubtitle}>
                Stock, sales & POS help
              </Text>
            </View>
            <Text style={styles.arrow}>↗</Text>
          </Pressable>
        </View>
      )}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView
          style={styles.screen}
          edges={["top", "bottom"]}
          accessibilityViewIsModal
        >
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.header}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>AI</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.title}>RJane Assistant</Text>
                <Text style={styles.subtitle}>Inventory, sales & POS help</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close chat"
                onPress={() => setOpen(false)}
                style={styles.close}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" accessible={false}><Path d="m6 6 12 12M18 6 6 18" /></Svg>
              </Pressable>
            </View>
            <View style={styles.toolbar}>
              <Text style={styles.powered}>Powered by Gemini</Text>
              <Pressable
                accessibilityRole="button"
                disabled={!messages.length && !draft}
                onPress={clearChat}
                style={styles.toolbarButton}
              >
                <Text style={styles.newChat}>New chat</Text>
              </Pressable>
            </View>
            <ScrollView
              ref={scroll}
              style={styles.flex}
              contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                scroll.current?.scrollToEnd({ animated: true })
              }
            >
              <View style={styles.welcome}>
                <Text style={styles.welcomeTitle}>How can I help today?</Text>
                <Text style={styles.welcomeCopy}>
                  Ask about current stock, today’s sales, or how to use your
                  POS.
                </Text>
                {!messages.length && (
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map((question) => (
                      <Pressable
                        key={question}
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => void send(question)}
                        style={({ pressed }) => [
                          styles.suggestion,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.suggestionText}>{question}</Text>
                        <Text style={styles.suggestionArrow}>↗</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              {messages.map((message, index) => (
                <View
                  key={index}
                  style={[
                    styles.message,
                    message.role === "user" && styles.userMessage,
                  ]}
                >
                  <Text style={styles.messageLabel}>
                    {message.role === "user" ? "You" : "RJane Assistant"}
                  </Text>
                  <View
                    style={[
                      styles.bubble,
                      message.role === "user" && styles.userBubble,
                    ]}
                  >
                    <Text
                      selectable
                      accessibilityLiveRegion={
                        message.role === "assistant" ? "polite" : undefined
                      }
                      style={[
                        styles.messageText,
                        message.role === "user" && styles.userText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              ))}
              {busy && (
                <View style={styles.thinking}>
                  <ActivityIndicator size="small" color="#1769E0" />
                  <Text
                    style={styles.thinkingText}
                    accessibilityLiveRegion="polite"
                  >
                    Thinking…
                  </Text>
                </View>
              )}
              {error ? (
                <View style={styles.error}>
                  <Text
                    style={styles.errorText}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="assertive"
                  >
                    {error}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      void send(messages[messages.length - 1].content, true)
                    }
                    style={styles.retry}
                  >
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
            <View style={styles.composer}>
              <View style={styles.inputRow}>
                <TextInput
                  ref={input}
                  accessibilityLabel="Message the assistant"
                  placeholder="Ask a question…"
                  placeholderTextColor="#7C8CA1"
                  multiline
                  maxLength={2000}
                  value={draft}
                  onChangeText={setDraft}
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  disabled={busy || !draft.trim()}
                  onPress={() => void send()}
                  style={({ pressed }) => [
                    styles.send,
                    (busy || !draft.trim()) && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.sendText}>↑</Text>
                </Pressable>
              </View>
              <Text style={styles.privacy}>
                Messages and a current inventory/sales summary are sent to
                Google Gemini. AI can make mistakes; verify figures in the POS.
              </Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactLauncher: {
    minWidth: 38,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaf2fe",
  },
  compactLabel: { color: "#2465c7", fontSize: 12, fontWeight: "700" },
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  launcherBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#DDE7EF",
  },
  launcher: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    minHeight: 48,
  },
  badge: {
    backgroundColor: "#EAF6FC",
    borderRadius: 12,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#1769E0", fontWeight: "800", fontSize: 14 },
  launcherTitle: { color: "#10213F", fontSize: 14, fontWeight: "700" },
  launcherSubtitle: { color: "#6F7F93", fontSize: 11, marginTop: 3 },
  arrow: { color: "#1769E0", fontSize: 24 },
  screen: { flex: 1, backgroundColor: "#F3F7FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#1769E0",
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF22",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: { color: "#FFFFFF", fontWeight: "800" },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  subtitle: { color: "#DBEAFE", fontSize: 12, marginTop: 3 },
  close: {
    width: 44,
    height: 44,
    flexShrink: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: 10,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DDE7EF",
  },
  powered: { color: "#6F7F93", fontSize: 11 },
  toolbarButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  newChat: { color: "#1769E0", fontSize: 12, fontWeight: "700" },
  messages: { padding: 16, width: "100%", maxWidth: 720, alignSelf: "center" },
  welcome: { paddingVertical: 16 },
  welcomeTitle: {
    color: "#10213F",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  welcomeCopy: {
    color: "#6F7F93",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  suggestions: { gap: 10, marginTop: 22 },
  suggestion: {
    padding: 14,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#DDE7EF",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  suggestionText: { flex: 1, color: "#10213F", fontSize: 13 },
  suggestionArrow: { color: "#1769E0", fontSize: 18 },
  message: { alignItems: "flex-start", marginVertical: 10, gap: 5 },
  userMessage: { alignItems: "flex-end" },
  messageLabel: { fontSize: 10, color: "#6F7F93", fontWeight: "700" },
  bubble: {
    maxWidth: "94%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EF",
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    padding: 14,
  },
  userBubble: {
    backgroundColor: "#1769E0",
    borderColor: "#1769E0",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
  },
  messageText: { color: "#10213F", fontSize: 14, lineHeight: 22 },
  userText: { color: "#FFFFFF" },
  thinking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  thinkingText: { color: "#6F7F93", fontSize: 12 },
  error: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FDECEF",
    borderWidth: 1,
    borderColor: "#F6C7CF",
  },
  errorText: { color: "#A02539", fontSize: 13, lineHeight: 20 },
  retry: { paddingTop: 12, minHeight: 44 },
  retryText: { color: "#A02539", fontWeight: "800", fontSize: 13 },
  composer: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DDE7EF",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#DDE7EF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#10213F",
    textAlignVertical: "top",
  },
  send: {
    width: 48,
    height: 48,
    backgroundColor: "#1769E0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#FFFFFF", fontSize: 26, fontWeight: "700" },
  privacy: {
    fontSize: 10,
    lineHeight: 15,
    color: "#6F7F93",
    marginTop: 10,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
});
