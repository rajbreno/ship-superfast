import { useState } from "react";
import { View, Text, Image, Alert, Platform, KeyboardAvoidingView } from "react-native";
import {
  Button,
  Card,
  Input,
  Separator,
  Spinner,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "expo-router";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Mail01Icon } from "@hugeicons/core-free-icons";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandLogo = require("../../assets/brand-logo.png");

const redirectTo = makeRedirectUri();

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accentColor = useThemeColor("accent");

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      const { redirect } = await signIn("google", { redirectTo });

      if (Platform.OS === "web") return;

      const result = await openAuthSessionAsync(
        redirect!.toString(),
        redirectTo,
      );

      if (result.type === "success") {
        const { url } = result;
        const code = new URL(url).searchParams.get("code");
        if (code) {
          await signIn("google", { code });
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)");
          }
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";
      console.error("Sign in error:", error);
      Alert.alert("Sign In Failed", message, [{ text: "OK" }]);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim()) return;
    try {
      setIsEmailLoading(true);
      await signIn("resend", { email: email.trim() });
      setEmailSent(true);
    } catch (error) {
      console.error("Email sign in error:", error);
      Alert.alert(
        "Email Sign In Failed",
        "Unable to send sign-in link. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-7">
        {/* Logo */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          className="items-center"
        >
          <Image
            source={brandLogo}
            className="h-20 w-20"
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          className="mt-8 items-center gap-2"
        >
          <Text className="text-center text-3xl font-bold text-foreground">
            Welcome back
          </Text>
          <Text className="text-center text-sm text-muted">
            Sign in to your account
          </Text>
        </Animated.View>

        {/* Auth buttons */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(350)}
          className="mt-10 gap-4"
        >
          {/* Google sign in */}
          <Button
            size="lg"
            variant="primary"
            onPress={handleGoogleSignIn}
            isDisabled={isGoogleLoading || isEmailLoading}
          >
            {isGoogleLoading ? (
              <Spinner size="sm" color="#fff" />
            ) : (
              <Button.Label>Sign in with Google</Button.Label>
            )}
          </Button>

          {/* Separator */}
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Separator />
            </View>
            <Text className="text-xs text-muted">or</Text>
            <View className="flex-1">
              <Separator />
            </View>
          </View>

          {/* Email sign in */}
          {emailSent ? (
            <Card>
              <Card.Body>
                <View className="items-center gap-3 py-2">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    size={28}
                    color={accentColor}
                  />
                  <Text className="text-center text-base text-foreground">
                    Check your email
                  </Text>
                  <Text className="text-center text-xs text-muted">
                    We sent a sign-in link to your inbox.
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                  >
                    <Button.Label>Use a different email</Button.Label>
                  </Button>
                </View>
              </Card.Body>
            </Card>
          ) : (
            <View className="gap-3">
              <TextField>
                <Input
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isEmailLoading}
                />
              </TextField>
              <Button
                size="lg"
                variant="outline"
                onPress={handleEmailSignIn}
                isDisabled={isEmailLoading || isGoogleLoading || !email.trim()}
              >
                {isEmailLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <Button.Label>Sign in with Email</Button.Label>
                )}
              </Button>
            </View>
          )}
        </Animated.View>

        {/* Terms */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(500)}
          className="mt-6"
        >
          <Text className="text-center text-xs leading-5 text-default-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
