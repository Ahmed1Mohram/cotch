# تعليمات Migration - تغيير هيكل الباقات والكورسات

## الخطوات المطلوبة بالترتيب:

### 1. شغّل `migrate_to_course_packages.sql` أولاً
   - افتح Supabase Dashboard
   - اذهب إلى SQL Editor
   - انسخ محتوى ملف `migrate_to_course_packages.sql`
   - الصقه في SQL Editor
   - اضغط Run
   - هذا سيقوم بـ:
     - إضافة عمود `course_id` إلى جدول `packages`
     - نقل البيانات من `package_courses` إلى `packages.course_id`
     - إنشاء index للأداء

### 2. شغّل `update_rls_for_course_packages.sql` بعد ذلك
   - بعد نجاح الخطوة الأولى
   - انسخ محتوى ملف `update_rls_for_course_packages.sql`
   - الصقه في SQL Editor
   - اضغط Run
   - هذا سيقوم بتحديث RLS policies

## ملاحظات مهمة:

- **يجب تشغيل الملفات بالترتيب**: `migrate_to_course_packages.sql` أولاً، ثم `update_rls_for_course_packages.sql`
- إذا ظهر خطأ "column course_id does not exist"، هذا يعني أنك لم تشغّل `migrate_to_course_packages.sql` بعد
- بعد تشغيل الـ migration، سيتم ربط الباقات الموجودة بالكورسات تلقائياً

## التحقق من نجاح الـ Migration:

بعد تشغيل `migrate_to_course_packages.sql`، ستظهر نتائج استعلام تظهر:
- اسم كل كورس
- عدد الباقات المرتبطة به

إذا رأيت هذه النتائج، فالمigration نجح!

