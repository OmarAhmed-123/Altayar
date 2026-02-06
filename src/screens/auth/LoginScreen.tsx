import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Animated,
  Easing,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from './../../stores/authStore';
import { useTheme } from './../../hooks/useTheme';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { AnimatedCard } from './../../components/animations/AnimatedCard';
import { getExpressiveIcon } from './../../utils/imageApiHelper';
import { oauthService } from './../../services/oauthService';
import Toast from 'react-native-toast-message';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Image URLs state
  const [logoImage, setLogoImage] = useState<string>('');
  const [emailIcon, setEmailIcon] = useState<string>('');
  const [lockIcon, setLockIcon] = useState<string>('');
  const [eyeIcon, setEyeIcon] = useState<string>('');
  const [errorIcon, setErrorIcon] = useState<string>('');
  const [loginButtonIcon, setLoginButtonIcon] = useState<string>('');
  const [registerLinkIcon, setRegisterLinkIcon] = useState<string>('');
  const [googleIcon, setGoogleIcon] = useState<string>('');
  const [appleIcon, setAppleIcon] = useState<string>('');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  
  // Animations
  const [headerFadeAnim] = useState(new Animated.Value(0));
  const [headerSlideAnim] = useState(new Animated.Value(-30));
  const [formFadeAnim] = useState(new Animated.Value(0));
  const [formSlideAnim] = useState(new Animated.Value(50));
  const [buttonScaleAnim] = useState(new Animated.Value(1));
  const [eyeIconScaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Load all images from API
    setLogoImage(getExpressiveIcon('login'));
    setEmailIcon(getExpressiveIcon('email'));
    setLockIcon(getExpressiveIcon('lock'));
    setEyeIcon(getExpressiveIcon(showPassword ? 'eye' : 'eye-off'));
    setErrorIcon(getExpressiveIcon('error'));
    setLoginButtonIcon(getExpressiveIcon('login'));
    setRegisterLinkIcon(getExpressiveIcon('register'));
    setGoogleIcon(getExpressiveIcon('google'));
    setAppleIcon(getExpressiveIcon('apple'));
  }, [showPassword]);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(headerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(formFadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(formSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerFadeAnim, headerSlideAnim, formFadeAnim, formSlideAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await login({ email, password });
      // Navigation will be handled by the auth store
    } catch (err: any) {
      // Error is already handled by authStore and displayed in the UI
      // Only show alert for unexpected errors
      if (err?.message && !err.message.includes('طلبات كثيرة')) {
        // Don't show duplicate alerts for rate limit errors (already shown in UI)
        console.warn('Login error:', err.message);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    setEyeIcon(getExpressiveIcon(showPassword ? 'eye-off' : 'eye'));
    // Eye icon animation
    Animated.sequence([
      Animated.timing(eyeIconScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(eyeIconScaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGoogleLogin = async () => {
    setOauthLoading('google');
    try {
      // Get OAuth config first
      await oauthService.getOAuthConfig();
      
      // For React Native, we need to use native OAuth libraries
      // This is a placeholder - in production, use @react-native-google-signin/google-signin
      Toast.show({
        type: 'info',
        text1: 'تسجيل الدخول بـ Google',
        text2: 'سيتم إضافة هذه الميزة قريباً',
      });
      
      // TODO: Implement Google Sign-In using @react-native-google-signin/google-signin
      // const { idToken } = await GoogleSignin.signIn();
      // const response = await oauthService.tokenExchange({
      //   provider: 'google',
      //   token: idToken,
      // });
      
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: err.message || 'فشل تسجيل الدخول بـ Google',
      });
    } finally {
      setOauthLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setOauthLoading('apple');
    try {
      // Get OAuth config first
      await oauthService.getOAuthConfig();
      
      // For React Native, we need to use native OAuth libraries
      // This is a placeholder - in production, use @invertase/react-native-apple-authentication
      Toast.show({
        type: 'info',
        text1: 'تسجيل الدخول بـ Apple',
        text2: 'سيتم إضافة هذه الميزة قريباً',
      });
      
      // TODO: Implement Apple Sign-In using @invertase/react-native-apple-authentication
      // const appleAuth = require('@invertase/react-native-apple-authentication').default;
      // const appleAuthRequestResponse = await appleAuth.performRequest({
      //   requestedOperation: appleAuth.Operation.LOGIN,
      //   requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      // });
      // const response = await oauthService.tokenExchange({
      //   provider: 'apple',
      //   token: appleAuthRequestResponse.identityToken,
      //   idToken: appleAuthRequestResponse.identityToken,
      // });
      
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: err.message || 'فشل تسجيل الدخول بـ Apple',
      });
    } finally {
      setOauthLoading(null);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl + 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
    },
    logoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      overflow: 'hidden',
    },
    logoImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    form: {
      marginBottom: theme.spacing.xl,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg + 4,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    labelIconContainer: {
      width: 20,
      height: 20,
      marginRight: theme.spacing.xs,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    inputWrapper: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md + 4,
      paddingLeft: 50,
      paddingRight: 50,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    inputIconContainer: {
      position: 'absolute',
      left: theme.spacing.md,
      zIndex: 1,
      width: 24,
      height: 24,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    eyeIcon: {
      position: 'absolute',
      right: theme.spacing.md,
      padding: theme.spacing.xs,
      zIndex: 1,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    eyeIconImage: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md + 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.md,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      flexDirection: 'row',
    },
    buttonIcon: {
      width: 22,
      height: 22,
      marginLeft: theme.spacing.sm,
      borderRadius: 11,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    link: {
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    linkContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    linkIcon: {
      width: 18,
      height: 18,
      marginRight: theme.spacing.xs,
      borderRadius: 9,
    },
    linkText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorIcon: {
      width: 18,
      height: 18,
      marginRight: theme.spacing.xs,
      borderRadius: 9,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      marginHorizontal: theme.spacing.md,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    oauthContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    oauthButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    oauthButtonGoogle: {
      borderColor: '#4285F4',
      backgroundColor: '#4285F4' + '10',
    },
    oauthButtonApple: {
      borderColor: '#000000',
      backgroundColor: '#000000' + '10',
    },
    oauthButtonIcon: {
      width: 20,
      height: 20,
      marginLeft: theme.spacing.sm,
      borderRadius: 10,
    },
    oauthButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    oauthButtonTextGoogle: {
      color: '#4285F4',
    },
    oauthButtonTextApple: {
      color: '#000000',
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="جاري تسجيل الدخول..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerFadeAnim,
                transform: [{ translateY: headerSlideAnim }],
              },
            ]}
          >
            <AnimatedCard
              style={styles.logoContainer}
              animationType="scale"
            >
              {logoImage ? (
                <Image
                  source={{ uri: logoImage }}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              ) : null}
            </AnimatedCard>
            <Text style={styles.title}>مرحباً بك</Text>
            <Text style={styles.subtitle}>سجل دخولك للاستمتاع بخدماتنا</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              {
                opacity: formFadeAnim,
                transform: [{ translateY: formSlideAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.inputContainer,
                {
                  opacity: formFadeAnim,
                  transform: [{ translateY: formSlideAnim }],
                },
              ]}
            >
              <View style={styles.label}>
                <View style={styles.labelIconContainer}>
                  {emailIcon ? (
                    <Image
                      source={{ uri: emailIcon }}
                      style={styles.labelIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <Text>البريد الإلكتروني</Text>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  {emailIcon ? (
                    <Image
                      source={{ uri: emailIcon }}
                      style={styles.inputIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="أدخل بريدك الإلكتروني"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.inputContainer,
                {
                  opacity: formFadeAnim,
                  transform: [{ translateY: formSlideAnim }],
                },
              ]}
            >
              <View style={styles.label}>
                <View style={styles.labelIconContainer}>
                  {lockIcon ? (
                    <Image
                      source={{ uri: lockIcon }}
                      style={styles.labelIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <Text>كلمة المرور</Text>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  {lockIcon ? (
                    <Image
                      source={{ uri: lockIcon }}
                      style={styles.inputIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="أدخل كلمة المرور"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={togglePasswordVisibility}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: eyeIconScaleAnim }],
                    }}
                  >
                    {eyeIcon ? (
                      <Image
                        source={{ uri: eyeIcon }}
                        style={styles.eyeIconImage}
                        resizeMode="cover"
                      />
                    ) : null}
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {error && (
              <Animated.View
                style={[
                  styles.errorText,
                  {
                    opacity: formFadeAnim,
                  },
                ]}
              >
                {errorIcon ? (
                  <Image
                    source={{ uri: errorIcon }}
                    style={styles.errorIcon}
                    resizeMode="cover"
                  />
                ) : null}
                <Text>{error}</Text>
              </Animated.View>
            )}

            <Animated.View
              style={{
                transform: [{ scale: buttonScaleAnim }],
              }}
            >
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleLogin}
                activeOpacity={0.9}
              >
                {loginButtonIcon ? (
                  <Image
                    source={{ uri: loginButtonIcon }}
                    style={styles.buttonIcon}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={styles.buttonText}>تسجيل الدخول</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* OAuth Divider */}
          <Animated.View
            style={[
              styles.divider,
              {
                opacity: formFadeAnim,
              },
            ]}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* OAuth Buttons */}
          <Animated.View
            style={[
              styles.oauthContainer,
              {
                opacity: formFadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.oauthButton, styles.oauthButtonGoogle]}
              onPress={handleGoogleLogin}
              disabled={oauthLoading !== null}
              activeOpacity={0.8}
            >
              {googleIcon && !oauthLoading && (
                <Image
                  source={{ uri: googleIcon }}
                  style={styles.oauthButtonIcon}
                  resizeMode="cover"
                />
              )}
              {oauthLoading === 'google' ? (
                <Text style={[styles.oauthButtonText, styles.oauthButtonTextGoogle]}>جاري...</Text>
              ) : (
                <Text style={[styles.oauthButtonText, styles.oauthButtonTextGoogle]}>Google</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthButton, styles.oauthButtonApple]}
              onPress={handleAppleLogin}
              disabled={oauthLoading !== null}
              activeOpacity={0.8}
            >
              {appleIcon && !oauthLoading && (
                <Image
                  source={{ uri: appleIcon }}
                  style={styles.oauthButtonIcon}
                  resizeMode="cover"
                />
              )}
              {oauthLoading === 'apple' ? (
                <Text style={[styles.oauthButtonText, styles.oauthButtonTextApple]}>جاري...</Text>
              ) : (
                <Text style={[styles.oauthButtonText, styles.oauthButtonTextApple]}>Apple</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.link,
              {
                opacity: formFadeAnim,
              },
            ]}
          >
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register' as never)}
              style={styles.linkContent}
            >
              {registerLinkIcon ? (
                <Image
                  source={{ uri: registerLinkIcon }}
                  style={styles.linkIcon}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={styles.linkText}>ليس لديك حساب؟ سجل الآن</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};
