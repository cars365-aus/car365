# Phase 4: Programmatic SEO Audit

**Audit Context**: The app uses Next.js dynamic routing to scale landing pages. We must evaluate whether this strategy creates spam or scales cleanly.

## Page Clusters Review

### 1. City Pages
- **URL pattern**: `/locations/[city]`
- **Exists or missing**: Exists
- **Score out of 10**: 9/10
- **Search intent**: Informational / Navigational
- **Thin-page risk**: Low. Protected by `total < 5` noindex rule.
- **Sitemap inclusion rule**: Handled by hardcoded array of major cities.
- **Improvement**: Make sitemap dynamic based on cities present in the database.

### 2. Brand + City Pages
- **URL pattern**: `/locations/[city]/[brand]`
- **Exists or missing**: Exists
- **Score out of 10**: 9/10
- **Search intent**: Transactional
- **Thin-page risk**: Low. Protected by `total < 3` noindex rule.
- **Sitemap inclusion rule**: Missing.
- **Improvement**: Needs a grouping query in `sitemap.ts` to output these URLs to Google automatically.

### 3. Model + City Pages
- **URL pattern**: `/locations/[city]/[brand]/[model]`
- **Exists or missing**: Missing
- **Score out of 10**: 0/10
- **Search intent**: High Transactional
- **Improvement**: Essential for scaling. Create this cluster next.

### 4. Body Type + City Pages
- **URL pattern**: `/used-[body-type]-in-[city]`
- **Exists or missing**: Missing
- **Score out of 10**: 0/10
- **Search intent**: Informational / Transactional ("used SUVs in Brisbane")
- **Improvement**: Scaffold this cluster. Huge volume potential.

## Top 25 Programmatic SEO Page Opportunities
1. /locations/sydney/toyota/rav4
2. /locations/melbourne/toyota/hilux
3. /locations/brisbane/ford/ranger
4. /used-suv-in-sydney
5. /used-hatchback-in-melbourne
6. /cars-under-20000-in-sydney
7. /cars-under-10000-in-brisbane
8. /locations/perth/hyundai/i30
9. /locations/adelaide/mitsubishi/triton
10. /locations/gold-coast/kia/sportage
11. /locations/sydney/mazda/cx-5
12. /used-ute-in-perth
13. /used-van-in-melbourne
14. /locations/hobart/subaru/outback
15. /cars-under-30000-in-perth
16. /locations/canberra/volkswagen/golf
17. /locations/sydney/tesla/model-3
18. /used-electric-in-sydney
19. /used-hybrid-in-melbourne
20. /locations/brisbane/nissan/navara
21. /locations/sydney/bmw/x5
22. /locations/melbourne/audi/q5
23. /cars-under-15000-in-adelaide
24. /used-sedan-in-brisbane
25. /locations/perth/toyota/prado

## Pages to Avoid (Thin/Doorway Risk)
- `/locations/[city]/[brand]/[model]/[color]` (Too deep, low volume, guaranteed thin content)
- `/locations/[suburb]/[brand]` (Search volume too low, better to handle suburbs via `LocalBusiness` schema on vendor profiles)
