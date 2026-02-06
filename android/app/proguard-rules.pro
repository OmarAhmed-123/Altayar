# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }
-dontwarn com.oblador.vectoricons.**

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}
-keepclassmembers class * {
  @react.* *;
}
-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class * { @com.facebook.proguard.annotations.DoNotStrip <methods>; }
-keepclassmembers class * {
  @com.facebook.proguard.annotations.DoNotStrip <methods>;
}
-keepclassmembers class * {
  @com.facebook.proguard.annotations.DoNotStrip <fields>;
}
-keepclassmembers class * {
  @com.facebook.proguard.annotations.DoNotStrip <init>(...);
}
