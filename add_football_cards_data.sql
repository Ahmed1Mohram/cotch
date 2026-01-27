-- Script to add Football course cards and content
-- Run this in Supabase SQL Editor after updating the course_id and package_ids

-- Step 1: Get the course ID for football (update slug if different)
DO $$
DECLARE
  v_football_course_id uuid;
  v_vip_package_id uuid;
  v_medium_package_id uuid;
  v_age_group_id uuid;
  v_player_card_id uuid;
  v_month_id uuid;
  v_day_id uuid;
BEGIN
  -- Get course ID
  SELECT id INTO v_football_course_id FROM public.courses WHERE slug = 'football' LIMIT 1;
  
  -- Get package IDs
  SELECT id INTO v_vip_package_id FROM public.packages WHERE slug = 'vip' LIMIT 1;
  SELECT id INTO v_medium_package_id FROM public.packages WHERE slug = 'medium' LIMIT 1;
  
  IF v_football_course_id IS NULL THEN
    RAISE EXCEPTION 'Football course not found. Please check the slug.';
  END IF;
  
  -- Step 2: Create Age Group for VIP package (age 0, weight 0, height 0)
  INSERT INTO public.age_groups (course_id, title, min_age, max_age, sort_order)
  VALUES (v_football_course_id, 'عام', 0, 0, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_age_group_id;
  
  -- If age group already exists, get its ID
  IF v_age_group_id IS NULL THEN
    SELECT id INTO v_age_group_id FROM public.age_groups 
    WHERE course_id = v_football_course_id AND title = 'عام' LIMIT 1;
  END IF;
  
  -- Link age group to VIP package
  IF v_vip_package_id IS NOT NULL AND v_age_group_id IS NOT NULL THEN
    INSERT INTO public.package_course_age_groups (package_id, course_id, age_group_id)
    VALUES (v_vip_package_id, v_football_course_id, v_age_group_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Link age group to Medium package
  IF v_medium_package_id IS NOT NULL AND v_age_group_id IS NOT NULL THEN
    INSERT INTO public.package_course_age_groups (package_id, course_id, age_group_id)
    VALUES (v_medium_package_id, v_football_course_id, v_age_group_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Step 3: Create Player Card (age=0, height=0, weight=0) for VIP
  INSERT INTO public.player_cards (age_group_id, age, height_cm, weight_kg, note, sort_order)
  VALUES (v_age_group_id, 0, 0, 0, 'كارت عام', 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_player_card_id;
  
  -- If card already exists, get its ID
  IF v_player_card_id IS NULL THEN
    SELECT id INTO v_player_card_id FROM public.player_cards 
    WHERE age_group_id = v_age_group_id AND age = 0 AND height_cm = 0 AND weight_kg = 0 LIMIT 1;
  END IF;
  
  -- Step 4: Create Month 1 for VIP package
  INSERT INTO public.months (age_group_id, package_id, title, month_number, sort_order)
  VALUES (v_age_group_id, v_vip_package_id, 'الشهر الأول', 1, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_month_id;
  
  IF v_month_id IS NULL THEN
    SELECT id INTO v_month_id FROM public.months 
    WHERE age_group_id = v_age_group_id AND package_id = v_vip_package_id AND month_number = 1 LIMIT 1;
  END IF;
  
  -- Step 5: Create Days for Month 1 (VIP)
  -- Day 1
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الأول', 1, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 1 LIMIT 1;
  END IF;
  
  -- Videos for Day 1 (VIP)
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'التمرينة الأولى', 'https://drive.google.com/file/d/1KkINO_uD2rsPTh312EpP7oMArths6Rhf/view', 
   '📌 3 مجاميع 1️⃣ دنبل 10 كيلو – 12 عدة 2️⃣ دنبل 12.5 كيلو – 12 عدة 3️⃣ دنبل 15 كيلو – 10 عدات

وقت الراحة بين كل مجموعة: دقيقة واحدة', false, 0),
  
  (v_day_id, 'التمرينة الثانية', 'https://drive.google.com/file/d/1Cxm9pZMsNN8YeVjXepDOqi6Xx8LGjyTZ/view',
   '📌 3 مجاميع 1️⃣ دنبل 10 كيلو – 15 عدة 2️⃣ دنبل 12.5 كيلو – 15 عدة 3️⃣ دنبل 15 كيلو – 10 عدات

وقت الراحة: دقيقة ونصف', false, 1),
  
  (v_day_id, 'التمرينة الثالثة', 'https://drive.google.com/file/d/1OZ4rtp34jppxFntB-hwQZoGlMT8C3I-P/view',
   '📌 3 مجاميع 1️⃣ 12 عدة لكل رجل (من غير وزن) 2️⃣ 12 عدة لكل رجل (دنبل 5 كيلو في كل إيد) 3️⃣ 12 عدة لكل رجل (دنبل 5 كيلو في كل إيد)

وقت الراحة بين المجاميع: دقيقتين', false, 2),
  
  (v_day_id, 'التمرينة الرابعة', 'https://drive.google.com/file/d/1OeDz0ygoneKZiwww9n4o0qyC-lePvTWP/view',
   '📌 مجموعتين 1️⃣ 25 عدة يمين وشمال 2️⃣ 30 عدة يمين وشمال

وقت الراحة بين المجاميع: 30 ثانية

✅ كده اليوم الأول خلص', false, 3)
  ON CONFLICT DO NOTHING;
  
  -- Day 2
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الثاني', 2, 1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 2 LIMIT 1;
  END IF;
  
  -- Videos for Day 2 (VIP)
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'التمرينة الأولى', 'https://drive.google.com/file/d/1kk8XVxulLHCwhhg98avSAQB6c26jaKJA/view',
   '📌 3 مجاميع 1️⃣ 12 جامب لكل رجل (من غير وزن) 2️⃣ 10 جمبات لكل رجل (دنبل 5 كيلو في كل إيد) 3️⃣ 8 جمبات لكل رجل (دنبل 7.5 كيلو – دنبل واحد في الإيد العكسية)

وقت الراحة: دقيقتين', false, 0),
  
  (v_day_id, 'التمرينة الثانية', 'https://drive.google.com/file/d/15dQA7dtUzEoz_eiMhigNTzjk4bQ_eiD0/view',
   '📌 3 مجاميع 1️⃣ 12 جامب لكل رجل 2️⃣ 15 جامب لكل رجل 3️⃣ 12 جامب لكل رجل (دنبل 5 كيلو في كل إيد)

وقت الراحة: دقيقتين', false, 1),
  
  (v_day_id, 'التمرينة الثالثة', 'https://drive.google.com/file/d/17rBMxGrfJllRr5sPrza6esjPGbE4D68f/view',
   '📌 3 مجاميع 1️⃣ 15 عدة لكل رجل 2️⃣ 15 عدة لكل رجل 3️⃣ 10 عدات لكل رجل (دنبل 5 كيلو في إيد واحدة والتانية فاضية)

وقت الراحة: دقيقة واحدة', false, 2),
  
  (v_day_id, 'التمرينة الرابعة', 'https://drive.google.com/file/d/1MtVR4oCC1qMrhG5HcBdbKxwUVAP5ldX4/view',
   '📌 3 مجاميع 1️⃣ 30 ثانية 2️⃣ 40 ثانية 3️⃣ من 50 إلى 60 ثانية

وقت الراحة: 30 ثانية

✅ كده اليوم الثاني خلص', false, 3)
  ON CONFLICT DO NOTHING;
  
  -- Day 3 (بدني في الملعب)
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الثالث (بدني في الملعب)', 3, 2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 3 LIMIT 1;
  END IF;
  
  -- Video for Day 3 (بدني)
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'تمرين الجري', NULL,
   '📌 جري 1️⃣ جري 10 دقائق حول الملعب بسرعة 50% راحة: دقيقتين

2️⃣ جري 5 دقائق حول الملعب بسرعة 70% راحة: 4 دقائق

3️⃣ جري 3 دقائق حول الملعب بسرعة 100% راحة: دقيقة

4️⃣ جري دقيقة واحدة بسرعة 100%', false, 0)
  ON CONFLICT DO NOTHING;
  
  -- Day 4
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الرابع', 4, 3)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 4 LIMIT 1;
  END IF;
  
  -- Videos for Day 4 (VIP)
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'التمرينة الأولى', 'https://drive.google.com/file/d/1w8db3y8kqUeGV1Kp2tChIqHQ6uHN-tZo/view',
   '📌 3 مجاميع 1️⃣ 12 عدة (البار فاضي) 2️⃣ 10 عدات (البار فيه طارة 5) 3️⃣ 8 عدات (البار فيه وزن 7.5)

وقت الراحة: دقيقة ونصف', false, 0),
  
  (v_day_id, 'التمرينة الثانية', 'https://drive.google.com/file/d/1DpEimw8YkJp7epv_BoI6Sb4j39CbXhjW/view',
   '📌 3 مجاميع 1️⃣ 12 2️⃣ 12 3️⃣ 12

وقت الراحة: دقيقتين', false, 1),
  
  (v_day_id, 'التمرينة الثالثة', 'https://drive.google.com/file/d/1JNVXbZmyFkDr6a4Rq2vT9_p6m4WWhC_o/view',
   '📌 3 مجاميع 1️⃣ 15 عدة 2️⃣ 20 عدة 3️⃣ 20 عدة

وقت الراحة: دقيقة ونصف', false, 2),
  
  (v_day_id, 'التمرينة الرابعة', 'https://drive.google.com/file/d/1y_yVkmnxqHb7pi39vAbXXClF96XDKR5_/view',
   '📌 3 مجاميع 1️⃣ 12 عدة (وزن 5 كيلو) 2️⃣ 12 عدة (وزن 5 كيلو) 3️⃣ 10 عدات (وزن 10 كيلو)

وقت الراحة: دقيقة ونصف', false, 3)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'VIP package data added successfully!';
  
  -- ============================================
  -- MEDIUM PACKAGE DATA
  -- ============================================
  
  -- Create Month 1 for Medium package
  INSERT INTO public.months (age_group_id, package_id, title, month_number, sort_order)
  VALUES (v_age_group_id, v_medium_package_id, 'الشهر الأول', 1, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_month_id;
  
  IF v_month_id IS NULL THEN
    SELECT id INTO v_month_id FROM public.months 
    WHERE age_group_id = v_age_group_id AND package_id = v_medium_package_id AND month_number = 1 LIMIT 1;
  END IF;
  
  -- Day 1 (Medium)
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الأول', 1, 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 1 LIMIT 1;
  END IF;
  
  -- Videos for Day 1 (Medium)
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'التمرينة الأولى', NULL,
   '📌 3 مجاميع
1️⃣ 12 عدة لكل جنب من جسمك
   (وزن 5 كيلو – طارة أو كرة طبية)
2️⃣ 12 عدة (وزن 10 كيلو)
3️⃣ 12 عدة (وزن 10 كيلو)

⏱️ وقت الراحة: دقيقتين', false, 0),
  
  (v_day_id, 'التمرينة الثالثة', 'https://drive.google.com/file/d/12BQtixNw3-susYrT_Tl-XqzRDd3iixYA/view',
   '📌 (مجموعتين)
1️⃣ 20 عدة يمين وشمال
2️⃣ 30 عدة يمين وشمال

⏱️ وقت الراحة: 30 ثانية

✅ فنش اليوم الأول كامل – الباقة الوسط ⚽⚽⚽⚽', false, 1)
  ON CONFLICT DO NOTHING;
  
  -- Day 2 (Medium - بدني)
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الثاني', 2, 1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 2 LIMIT 1;
  END IF;
  
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'تمرين الجري', NULL,
   '📌 بدني (في الملعب)
1️⃣ جري 10 دقائق حول الملعب – سرعة 50%
   🤌🏽 راحة دقيقتين
2️⃣ جري 5 دقائق – سرعة 70%
   🤌🏽 راحة 4 دقائق
3️⃣ جري 3 دقائق – سرعة 100%
   🤌🏽 راحة دقيقة
4️⃣ جري دقيقة واحدة – سرعة 100%

✅ فنش اليوم الثاني – الباقة الوسط 💯⚽', false, 0)
  ON CONFLICT DO NOTHING;
  
  -- Day 3 (Medium)
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الثالث', 3, 2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 3 LIMIT 1;
  END IF;
  
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'التمرينة الأولى', 'https://drive.google.com/file/d/1Cxm9pZMsNN8YeVjXepDOqi6Xx8LGjyTZ/view',
   '📌 (3 مجاميع)
1️⃣ دنبل 10 كيلو – 15 عدة
2️⃣ دنبل 12.5 كيلو – 15 عدة
3️⃣ دنبل 15 كيلو – 10 عدات

⏱️ الراحة: دقيقة ونص', false, 0),
  
  (v_day_id, 'التمرينة الثانية', 'https://drive.google.com/file/d/1OZ4rtp34jppxFntB-hwQZoGlMT8C3I-P/view',
   '📌 (3 مجاميع)
1️⃣ 12 عدة لكل رجل (من غير وزن)
2️⃣ 12 عدة لكل رجل (دنبل 5 كيلو في كل إيد)
3️⃣ 12 عدة لكل رجل (دنبل 5 كيلو في كل إيد)

⏱️ الراحة: دقيقتين', false, 1),
  
  (v_day_id, 'التمرينة الثالثة', 'https://drive.google.com/file/d/1KkINO_uD2rsPTh312EpP7oMArths6Rhf/view',
   '📌 3 مجاميع
1️⃣ دنبل 10 كيلو – 12 عدة
2️⃣ دنبل 12.5 كيلو – 12 عدة
3️⃣ دنبل 15 كيلو – 10 عدات

⏱️ الراحة: دقيقة واحدة', false, 2),
  
  (v_day_id, 'التمرينة الرابعة', NULL,
   '📌 (مجموعتين – اسبرنت)
1️⃣ 3 اسبرنتات لكل رجل (5 متر)
2️⃣ 4 اسبرنتات لكل رجل (5 متر)

⏱️ الراحة: 20 ثانية بين كل اسبرنت

🔥 فنش اليوم الثالث – الباقة الوسط ⚽🔥🔥🔥', false, 3)
  ON CONFLICT DO NOTHING;
  
  -- Day 4 (Medium)
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الرابع', 4, 3)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 4 LIMIT 1;
  END IF;
  
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'التمرينة الأولى', 'https://drive.google.com/file/d/1hlnS66Zy2BeZc10aAYaDkpTSNyPgT5wJ/view',
   '📌 (مجموعتين – اسبرنت)
1️⃣ 3 اسبرنتات لكل رجل
2️⃣ 4 اسبرنتات لكل رجل

⏱️ الراحة: 20 ثانية', false, 0),
  
  (v_day_id, 'التمرينة الثانية', 'https://drive.google.com/file/d/1OaFuvqZrGgg1EYV8iX0SynI2if5ig4J5/view',
   '📌 (مجموعتين – اسبرنت)
1️⃣ 3 اسبرنتات لكل رجل
2️⃣ 4 اسبرنتات لكل رجل

⏱️ الراحة: 20 ثانية', false, 1),
  
  (v_day_id, 'التمرينة الثالثة', 'https://drive.google.com/file/d/1xDEbhviVEi70mq_mml0Y5M36x8MD8Xix/view',
   '📌 (مجموعتين)
1️⃣ 20 عدة لكل رجل يمين وشمال
2️⃣ 25 عدة لكل رجل يمين وشمال

⏱️ الراحة: 20 ثانية

🔥 فنش اليوم الرابع – الباقة الوسط 💯⚽', false, 2)
  ON CONFLICT DO NOTHING;
  
  -- Day 5 (Medium)
  INSERT INTO public.days (month_id, title, day_number, sort_order)
  VALUES (v_month_id, 'اليوم الخامس', 5, 4)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_day_id;
  
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id FROM public.days 
    WHERE month_id = v_month_id AND day_number = 5 LIMIT 1;
  END IF;
  
  INSERT INTO public.videos (day_id, title, video_url, details, is_free_preview, sort_order) VALUES
  (v_day_id, 'التمرينة الأولى', 'https://drive.google.com/file/d/1DpEimw8YkJp7epv_BoI6Sb4j39CbXhjW/view',
   '📌 3 مجاميع
1️⃣ 12
2️⃣ 12
3️⃣ 12

⏱️ الراحة: دقيقتين', false, 0),
  
  (v_day_id, 'التمرينة الثانية', 'https://drive.google.com/file/d/1JNVXbZmyFkDr6a4Rq2vT9_p6m4WWhC_o/view',
   '📌 3 مجاميع
1️⃣ 15 عدة
2️⃣ 20 عدة
3️⃣ 20 عدة

⏱️ الراحة: دقيقة ونص', false, 1),
  
  (v_day_id, 'التمرينة الثالثة', 'https://drive.google.com/file/d/1y_yVkmnxqHb7pi39vAbXXClF96XDKR5_/view',
   '📌 3 مجاميع
1️⃣ 12 عدة (وزن 5 كيلو)
2️⃣ 12 عدة (وزن 5 كيلو)
3️⃣ 10 عدات (وزن 10 كيلو)

⏱️ الراحة: دقيقة ونص', false, 2),
  
  (v_day_id, 'التمرينة الرابعة', 'https://drive.google.com/file/d/1Nu8MwOcI4wG_rnp93pFkcbQHHNcSAXqQ/view?usp=drivesdk',
   '📌 3 مجاميع
1️⃣ 20 عدة (وزن 2.5 كيلو في كل إيد)
2️⃣ 25 عدة (وزن 2.5 كيلو في كل إيد)
3️⃣ 15 عدة (دنبل 5 كيلو في كل إيد)

⏱️ وقت الراحة: دقيقة ونص

✅ فنش التمرينة الرابعة في اليوم الخامس 💯⚽', false, 3),
  
  (v_day_id, 'التمرينة الخامسة', 'https://drive.google.com/file/d/1PI86Cq4Aw3dG8t4Qsi_Ri_eKst1HBkCz/view?usp=drivesdk',
   '📌 3 مجاميع
1️⃣ 15 عدة يمين / شمال (من غير وزن)
2️⃣ 15 عدة يمين / شمال (دنبل 5 كيلو في كل إيد)
3️⃣ 12 عدة يمين / شمال

دنبل 10 كيلو في إيد واحدة

6 عدات وتبدل الدنبل للإيد التانية في الـ6 عدات الباقيين

⏱️ وقت الراحة: دقيقة ونص', false, 4)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Medium package data added successfully!';
  
END $$;

