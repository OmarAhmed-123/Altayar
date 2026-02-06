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

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Image URLs state
  const [logoImage, setLogoImage] = useState<string>('');
  const [personIcon, setPersonIcon] = useState<string>('');
  const [badgeIcon, setBadgeIcon] = useState<string>('');
  const [emailIcon, setEmailIcon] = useState<string>('');
  const [lockIcon, setLockIcon] = useState<string>('');
  const [eyeIcon, setEyeIcon] = useState<string>('');
  const [eyeOffIcon, setEyeOffIcon] = useState<string>('');
  const [errorIcon, setErrorIcon] = useState<string>('');
  const [successIcon, setSuccessIcon] = useState<string>('');
  const [cancelIcon, setCancelIcon] = useState<string>('');
  const [registerButtonIcon, setRegisterButtonIcon] = useState<string>('');
  const [loginLinkIcon, setLoginLinkIcon] = useState<string>('');
  const [googleIcon, setGoogleIcon] = useState<string>('');
  const [appleIcon, setAppleIcon] = useState<string>('');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  
  // Animations
  const [headerFadeAnim] = useState(new Animated.Value(0));
  const [headerSlideAnim] = useState(new Animated.Value(-30));
  const [formFadeAnim] = useState(new Animated.Value(0));
  const [formSlideAnim] = useState(new Animated.Value(50));
  const [buttonScaleAnim] = useState(new Animated.Value(1));
  const [passwordEyeScaleAnim] = useState(new Animated.Value(1));
  const [confirmPasswordEyeScaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Load all images from API
    setLogoImage(getExpressiveIcon('register'));
    setPersonIcon(getExpressiveIcon('person'));
    setBadgeIcon(getExpressiveIcon('badge'));
    setEmailIcon(getExpressiveIcon('email'));
    setLockIcon(getExpressiveIcon('lock'));
    setEyeIcon(getExpressiveIcon('eye'));
    setEyeOffIcon(getExpressiveIcon('eye-off'));
    setErrorIcon(getExpressiveIcon('error'));
    setSuccessIcon(getExpressiveIcon('success'));
    setCancelIcon(getExpressiveIcon('cancel'));
    setRegisterButtonIcon(getExpressiveIcon('register'));
    setLoginLinkIcon(getExpressiveIcon('login'));
    setGoogleIcon(getExpressiveIcon('google'));
    setAppleIcon(getExpressiveIcon('apple'));
  }, []);

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

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
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
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
    } catch (err: any) {
      Alert.alert('خطأ في التسجيل', err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Eye icon animation
    Animated.sequence([
      Animated.timing(passwordEyeScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(passwordEyeScaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
    // Eye icon animation
    Animated.sequence([
      Animated.timing(confirmPasswordEyeScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(confirmPasswordEyeScaleAnim, {
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
      await oauthService.getOAuthConfig();
      Toast.show({
        type: 'info',
        text1: 'التسجيل بـ Google',
        text2: 'سيتم إضافة هذه الميزة قريباً',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: err.message || 'فشل التسجيل بـ Google',
      });
    } finally {
      setOauthLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setOauthLoading('apple');
    try {
      await oauthService.getOAuthConfig();
      Toast.show({
        type: 'info',
        text1: 'التسجيل بـ Apple',
        text2: 'سيتم إضافة هذه الميزة قريباً',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: err.message || 'فشل التسجيل بـ Apple',
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
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
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
      fontSize: 12,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorIcon: {
      width: 14,
      height: 14,
      marginRight: theme.spacing.xs,
      borderRadius: 7,
    },
    passwordMatchIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
    passwordMatchIcon: {
      width: 16,
      height: 16,
      marginRight: theme.spacing.xs,
      borderRadius: 8,
    },
    passwordMatchText: {
      fontSize: 12,
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
    return <LoadingSpinner text="جاري إنشاء الحساب..." />;
  }

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsDontMatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword;

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
            <Text style={styles.title}>إنشاء حساب جديد</Text>
            <Text style={styles.subtitle}>انضم إلينا واستمتع بخدماتنا</Text>
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
                  {badgeIcon ? (
                    <Image
                      source={{ uri: badgeIcon }}
                      style={styles.labelIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <Text>الاسم الأول</Text>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  {personIcon ? (
                    <Image
                      source={{ uri: personIcon }}
                      style={styles.inputIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  placeholder="أدخل اسمك الأول"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="words"
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
                  {badgeIcon ? (
                    <Image
                      source={{ uri: badgeIcon }}
                      style={styles.labelIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <Text>الاسم الأخير</Text>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  {personIcon ? (
                    <Image
                      source={{ uri: personIcon }}
                      style={styles.inputIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  placeholder="أدخل اسمك الأخير"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="words"
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
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
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
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
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
                      transform: [{ scale: passwordEyeScaleAnim }],
                    }}
                  >
                    {showPassword ? (eyeIcon ? (
                      <Image
                        source={{ uri: eyeIcon }}
                        style={styles.eyeIconImage}
                        resizeMode="cover"
                      />
                    ) : null) : (eyeOffIcon ? (
                      <Image
                        source={{ uri: eyeOffIcon }}
                        style={styles.eyeIconImage}
                        resizeMode="cover"
                      />
                    ) : null)}
                  </Animated.View>
                </TouchableOpacity>
              </View>
              {formData.password.length > 0 && formData.password.length < 6 && (
                <View style={styles.errorText}>
                  {errorIcon ? (
                    <Image
                      source={{ uri: errorIcon }}
                      style={styles.errorIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text>كلمة المرور يجب أن تكون 6 أحرف على الأقل</Text>
                </View>
              )}
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
                <Text>تأكيد كلمة المرور</Text>
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
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  placeholder="أعد إدخال كلمة المرور"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={toggleConfirmPasswordVisibility}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: confirmPasswordEyeScaleAnim }],
                    }}
                  >
                    {showConfirmPassword ? (eyeIcon ? (
                      <Image
                        source={{ uri: eyeIcon }}
                        style={styles.eyeIconImage}
                        resizeMode="cover"
                      />
                    ) : null) : (eyeOffIcon ? (
                      <Image
                        source={{ uri: eyeOffIcon }}
                        style={styles.eyeIconImage}
                        resizeMode="cover"
                      />
                    ) : null)}
                  </Animated.View>
                </TouchableOpacity>
              </View>
              {passwordsMatch && (
                <View style={styles.passwordMatchIndicator}>
                  {successIcon ? (
                    <Image
                      source={{ uri: successIcon }}
                      style={styles.passwordMatchIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={[styles.passwordMatchText, { color: theme.colors.success }]}>
                    كلمة المرور متطابقة
                  </Text>
                </View>
              )}
              {passwordsDontMatch && (
                <View style={styles.passwordMatchIndicator}>
                  {cancelIcon ? (
                    <Image
                      source={{ uri: cancelIcon }}
                      style={styles.passwordMatchIcon}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={[styles.passwordMatchText, { color: theme.colors.error }]}>
                    كلمة المرور غير متطابقة
                  </Text>
                </View>
              )}
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: buttonScaleAnim }],
              }}
            >
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleRegister}
                activeOpacity={0.9}
              >
                {registerButtonIcon ? (
                  <Image
                    source={{ uri: registerButtonIcon }}
                    style={styles.buttonIcon}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={styles.buttonText}>إنشاء الحساب</Text>
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
              onPress={() => navigation.navigate('Login' as never)}
              style={styles.linkContent}
            >
              {loginLinkIcon ? (
                <Image
                  source={{ uri: loginLinkIcon }}
                  style={styles.linkIcon}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={styles.linkText}>لديك حساب بالفعل؟ سجل دخولك</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      {/* تم إزالة اختيار نوع الحساب من شاشة التسجيل.
          سيتم تعيين الدور الافتراضي من الباك إند كـ customer / مستخدم عادي. */}
    </View>
  );
};
