import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  FlatList,
  useWindowDimensions,
  type ViewToken,
  type ImageSourcePropType,
} from "react-native";
import { Button, Card, Separator, useThemeColor } from "heroui-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  FingerPrintIcon,
  CloudUploadIcon,
  CreditCardIcon,
  Mail01Icon,
  AiChat02Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
const ONBOARDING_KEY = "hasSeenOnboarding";

type IconSvgObject = typeof FingerPrintIcon;

/* ── Data ────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandLogo = require("../../assets/brand-logo.png");

const techStack: { name: string; purpose: string; logo: ImageSourcePropType }[] = [
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "Convex", purpose: "Realtime Backend", logo: require("../../assets/stack-logos/convex.png") },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "Expo 54", purpose: "Mobile Framework", logo: require("../../assets/stack-logos/expo.png") },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "Turborepo", purpose: "Monorepo Build", logo: require("../../assets/stack-logos/turbo.png") },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "TypeScript", purpose: "Type Safety", logo: require("../../assets/stack-logos/type.png") },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "HeroUI Native", purpose: "Mobile Components", logo: require("../../assets/stack-logos/herouinative.png") },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "Tailwind v4", purpose: "Styling", logo: require("../../assets/stack-logos/tailwind.png") },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "Cloudflare R2", purpose: "File Storage", logo: require("../../assets/stack-logos/cloudflare.png") },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "Dodo Payments", purpose: "Payments", logo: require("../../assets/stack-logos/dodo.png") },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  { name: "Resend", purpose: "Email", logo: require("../../assets/stack-logos/resend.png") },
];

const features: { icon: IconSvgObject; title: string }[] = [
  { icon: FingerPrintIcon, title: "Authentication" },
  { icon: CloudUploadIcon, title: "File Storage" },
  { icon: CreditCardIcon, title: "Payments" },
  { icon: Mail01Icon, title: "Email" },
  { icon: AiChat02Icon, title: "AI Agents" },
  { icon: Notification01Icon, title: "Push" },
];

type SlideId = "welcome" | "stack" | "features";
const slideIds: SlideId[] = ["welcome", "stack", "features"];

const BOTTOM_HEIGHT = 120;

/* ── Animated dot ────────────────────────────────────────────────── */

function Dot({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 24 : 8, { duration: 300 }),
    opacity: withTiming(active ? 1 : 0.35, { duration: 300 }),
  }));

  return (
    <Animated.View className="h-2 rounded-full bg-accent" style={style} />
  );
}

/* ── Main ────────────────────────────────────────────────────────── */

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList<SlideId>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const accentColor = useThemeColor("accent");

  const slideHeight = height - insets.top - insets.bottom - BOTTOM_HEIGHT;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<SlideId>[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(auth)/sign-in");
  }, [router]);

  const handleNext = useCallback(() => {
    if (activeIndex < slideIds.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      completeOnboarding();
    }
  }, [activeIndex, completeOnboarding]);

  const isLastSlide = activeIndex === slideIds.length - 1;

  const renderSlide = useCallback(
    ({ item }: { item: SlideId }) => {
      const needsScroll = item === "stack" || item === "features";

      return (
        <View style={{ width, height: slideHeight }}>
          {/* ── Skip ── */}
          <View className="flex-row justify-end px-5 pt-3">
            <Button variant="tertiary" size="sm" onPress={completeOnboarding}>
              <Button.Label>Skip</Button.Label>
            </Button>
          </View>

          {/* ── Content ── */}
          {needsScroll ? (
            <ScrollView
              className="flex-1"
              contentContainerClassName="justify-center px-7 py-6"
              showsVerticalScrollIndicator={false}
            >
              {item === "stack" && <StackSlide />}
              {item === "features" && (
                <FeaturesSlide accentColor={accentColor} />
              )}
            </ScrollView>
          ) : (
            <View className="flex-1 justify-center px-7">
              {item === "welcome" && <WelcomeSlide />}
            </View>
          )}
        </View>
      );
    },
    [width, slideHeight, accentColor, completeOnboarding],
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* ── Slides ── */}
      <FlatList
        ref={flatListRef}
        data={slideIds}
        renderItem={renderSlide}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* ── Fixed bottom — dots + button ── */}
      <View
        style={{ height: BOTTOM_HEIGHT }}
        className="items-center justify-center gap-6 px-7"
      >
        <View className="flex-row gap-2">
          {slideIds.map((id, i) => (
            <Dot key={id} active={i === activeIndex} />
          ))}
        </View>

        <View className="w-full">
          <Button size="lg" variant="primary" onPress={handleNext}>
            {isLastSlide ? (
              <Animated.View
                key="get-started"
                entering={FadeIn.duration(250)}
                exiting={FadeOut.duration(150)}
              >
                <Button.Label>Get Started</Button.Label>
              </Animated.View>
            ) : (
              <Animated.View
                key="continue"
                entering={FadeIn.duration(250)}
                exiting={FadeOut.duration(150)}
              >
                <Button.Label>Continue</Button.Label>
              </Animated.View>
            )}
          </Button>
        </View>
      </View>
    </View>
  );
}

/* ── Slide 1 — Welcome ───────────────────────────────────────────── */

function WelcomeSlide() {
  return (
    <View className="items-center">
      <Animated.View entering={FadeInDown.duration(600).delay(100)}>
        <Image
          source={brandLogo}
          className="h-24 w-24"
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(500).delay(250)}
        className="mt-10 items-center gap-3"
      >
        <Text className="text-center text-4xl font-bold text-foreground">
          Ship Superfast
        </Text>
        <Text className="px-4 text-center text-sm leading-6 text-default-500">
          Your app comes packed with auth, storage, payments, email, AI, and
          push notifications — all ready to go.
        </Text>
      </Animated.View>
    </View>
  );
}

/* ── Slide 2 — Tech Stack ────────────────────────────────────────── */

function StackSlide() {
  return (
    <View>
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="items-center gap-2"
      >
        <Text className="text-center text-3xl font-bold text-foreground">
          The Stack
        </Text>
        <Text className="px-4 text-center text-sm leading-5 text-default-500">
          Every technology powering your app.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(150)} className="mt-6">
        <Card>
          <Card.Body>
            {techStack.map((t, i) => (
              <View key={t.name}>
                {i > 0 && <Separator />}
                <View className="flex-row items-center gap-4 px-1 py-3">
                  <Image
                    source={t.logo}
                    className="h-14 w-14 rounded-xl"
                    resizeMode="contain"
                  />
                  <View>
                    <Text className="text-sm text-foreground">
                      {t.name}
                    </Text>
                    <Text className="text-xs text-default-500">
                      {t.purpose}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card.Body>
        </Card>
      </Animated.View>
    </View>
  );
}

/* ── Slide 3 — Features ──────────────────────────────────────────── */

function FeaturesSlide({ accentColor }: { accentColor: string }) {
  return (
    <View>
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="items-center gap-2"
      >
        <Text className="text-center text-3xl font-bold text-foreground">
          Everything Built In
        </Text>
        <Text className="px-4 text-center text-sm leading-5 text-default-500">
          Six production features, ready from day one.
        </Text>
      </Animated.View>

      <View className="mt-6 flex-row flex-wrap justify-between gap-y-3">
        {features.map((f, i) => (
          <Animated.View
            key={f.title}
            entering={FadeInUp.duration(400).delay(150 + i * 70)}
            className="w-[48%]"
          >
            <Card>
              <Card.Body>
                <View className="items-center gap-3 py-1">
                  <HugeiconsIcon icon={f.icon} size={28} color={accentColor} />
                  <Text className="text-center text-xs text-foreground">
                    {f.title}
                  </Text>
                </View>
              </Card.Body>
            </Card>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };
