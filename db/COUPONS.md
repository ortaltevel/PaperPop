# ניהול קופונים

הקופונים נשמרים בטבלת `coupons`. הקוד נשמר באותיות אנגליות גדולות, ויכול להכיל גם מספרים, מקף וקו תחתון.

## יצירת קופון

```sql
INSERT INTO coupons (code, discount_percent, active, starts_at, ends_at, max_redemptions)
VALUES ('WELCOME10', 10, true, now(), '2026-12-31 23:59:59+02', 100);
```

אפשר להשאיר `starts_at`, `ends_at` או `max_redemptions` כ־`NULL` כאשר לא רוצים מגבלה מסוג זה.

## הפעלה וכיבוי

```sql
UPDATE coupons SET active = false WHERE code = 'WELCOME10';
UPDATE coupons SET active = true WHERE code = 'WELCOME10';
```

## שינוי אחוז, תאריך או מכסה

```sql
UPDATE coupons
SET discount_percent = 15,
    ends_at = '2026-12-31 23:59:59+02',
    max_redemptions = 150
WHERE code = 'WELCOME10';
```

לא מומלץ לשנות את אחוז ההנחה בזמן שלקוחות נמצאים בתהליך תשלום. קופון מאומת שוב לפני פתיחת התשלום, ולכן הסכום העדכני הוא הקובע.

## בדיקת שימושים

```sql
SELECT
  c.code,
  c.active,
  c.discount_percent,
  c.max_redemptions,
  count(*) FILTER (WHERE r.status = 'paid') AS paid_redemptions
FROM coupons c
LEFT JOIN coupon_redemptions r ON r.coupon_code = c.code
GROUP BY c.code
ORDER BY c.created_at DESC;
```

רק הזמנה שקיבלה אישור תשלום נספרת כמימוש. בזמן שהלקוח נמצא בעמוד התשלום נשמר מקום במכסה למשך שעה כדי למנוע חריגה ברכישות מקבילות.
