# Bugfix Requirements Document

## Introduction

When a vendor lists a new vehicle on the Carhire marketplace, the vehicle is saved
to the database and may briefly appear in the UI, but it does not become reliably
discoverable to renters. After a page refresh the vehicle disappears from listing
surfaces, and it cannot be found through search by location or by browsing a
category with a location filter applied.

The observable example: a Corvette listed in Sydney under the Luxury category shows
up momentarily after listing, but vanishes on refresh and never appears when
searching Sydney, nor when browsing the Luxury category filtered to Sydney.

The impact is severe: vehicles that vendors pay to list are effectively invisible to
customers, undermining the core value of the marketplace. The root behaviour is that
newly listed (and approved) vehicles are not made visible in the search-backed
listing surfaces (home page, search results, and category/location filtered views),
because the search index that powers those surfaces is never updated to include them.

## Bug Analysis

### Current Behavior (Defect)

What currently happens when a vendor lists a new, eligible (approved) vehicle:

1.1 WHEN a vendor successfully lists a new approved vehicle THEN the system displays it only transiently, and the vehicle is no longer shown on listing surfaces after the page is refreshed

1.2 WHEN a renter searches by the vehicle's location (e.g. Sydney) THEN the system does not return the newly listed vehicle in the search results

1.3 WHEN a renter browses the vehicle's category (e.g. Luxury) with the vehicle's location filter applied (e.g. Sydney) THEN the system does not show the newly listed vehicle

1.4 WHEN a newly listed approved vehicle exists in the database but has not been reflected into the search-backed listing surfaces THEN the system treats it as if it does not exist for discovery purposes, with no error surfaced to the vendor or renter

### Expected Behavior (Correct)

What should happen instead:

2.1 WHEN a vendor successfully lists a new approved vehicle THEN the system SHALL make the vehicle persistently visible on listing surfaces, and it SHALL continue to appear after the page is refreshed

2.2 WHEN a renter searches by the vehicle's location (e.g. Sydney) THEN the system SHALL return the newly listed approved vehicle in the search results

2.3 WHEN a renter browses the vehicle's category (e.g. Luxury) with the vehicle's location filter applied (e.g. Sydney) THEN the system SHALL show the newly listed approved vehicle

2.4 WHEN a newly listed approved vehicle is saved THEN the system SHALL reflect it into the search-backed listing surfaces within a bounded, predictable time so that it becomes discoverable to renters

### Unchanged Behavior (Regression Prevention)

Existing behavior that must be preserved:

3.1 WHEN a vehicle is already discoverable in search and listing surfaces THEN the system SHALL CONTINUE TO display it with the same search, filter, and sorting results as before

3.2 WHEN a vehicle is not approved (e.g. pending, suspended, or rejected, or belongs to a non-approved organization or branch) THEN the system SHALL CONTINUE TO exclude it from public search and listing surfaces

3.3 WHEN a renter applies location, category, price, seats, transmission, or fuel filters THEN the system SHALL CONTINUE TO return only vehicles that match those filters

3.4 WHEN a vehicle is removed, suspended, or rejected THEN the system SHALL CONTINUE TO stop showing it on public listing and search surfaces

3.5 WHEN existing vehicles are searched or browsed THEN the system SHALL CONTINUE TO resolve vehicle images, vendor and branch details, and pricing exactly as it does today

## Bug Condition and Properties

### Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type Vehicle
  OUTPUT: boolean

  // X is eligible to be shown publicly (approved vehicle, approved org, approved branch)
  // but is NOT yet reflected into the search-backed listing surfaces
  // (i.e. it was recently listed/updated and its index entry is missing or stale).
  RETURN isPubliclyEligible(X) AND NOT isVisibleInListingSurfaces(X)
END FUNCTION
```

### Property: Fix Checking

```pascal
// For every approved vehicle that should be discoverable,
// it must appear in the search-backed listing surfaces.
FOR ALL X WHERE isBugCondition(X) DO
  ASSERT appearsInSearchByLocation(X, X.city)
  ASSERT appearsInCategoryWithLocationFilter(X, X.category, X.city)
  ASSERT appearsOnListingSurfacesAfterRefresh(X)
END FOR
```

### Property: Preservation Checking

```pascal
// For every input that is not affected by the bug, the fixed system
// behaves identically to the original system.
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

**Key Definitions:**
- **F**: The current (unfixed) behaviour, where newly listed approved vehicles never reach the search-backed listing surfaces.
- **F'**: The fixed behaviour, where newly listed approved vehicles become discoverable within a bounded time.
- **isPubliclyEligible(X)**: X has `status = approved`, with an approved organization and approved branch.
- **isVisibleInListingSurfaces(X)**: X is returned by the search/listing layer that powers the home page, search results, and category/location filtered views.
