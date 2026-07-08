# Drift / SQLite
-keep class org.sqlite.** { *; }
-keep class org.sqlite.database.** { *; }

# MLKit
-keep class com.google.mlkit.** { *; }
# MLKit scripts no incluidos (solo usamos Latin)
-dontwarn com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions$Builder
-dontwarn com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions
-dontwarn com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions$Builder
-dontwarn com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions
-dontwarn com.google.mlkit.vision.text.japanese.JapaneseTextRecognizerOptions$Builder
-dontwarn com.google.mlkit.vision.text.japanese.JapaneseTextRecognizerOptions
-dontwarn com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions$Builder
-dontwarn com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions

# uCrop (image_cropper)
-dontwarn com.yalantis.ucrop.**
-keep class com.yalantis.ucrop.** { *; }
