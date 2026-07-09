# Bugfix Requirements Document

## Introduction

The Carhire platform is an Australia-only car hire marketplace. The pickup location autocomplete currently returns results from any country worldwide because the geocoding API proxy does not apply a country filter. This allows users to select non-Australian locations (e.g., cities in the US, UK, or Asia) as pickup locations, which are invalid for this platform.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user types a location query in the pickup autocomplete THEN the system returns geocoding results from all countries worldwide, including non-Australian locations

1.2 WHEN a user selects a non-Australian city from the autocomplete suggestions THEN the system accepts it as a valid pickup location and uses it in the search query

1.3 WHEN the geocode API proxy (`/api/geocode`) is called with a query string THEN the system forwards the request to Photon without any country restriction parameter

### Expected Behavior (Correct)

2.1 WHEN a user types a location query in the pickup autocomplete THEN the system SHALL return only Australian locations in the geocoding results

2.2 WHEN a user selects a location from the autocomplete suggestions THEN the system SHALL only allow Australian cities/locations to be used as the pickup location

2.3 WHEN the geocode API proxy (`/api/geocode`) is called with a query string THEN the system SHALL restrict results to Australia only (e.g., using the `countrycodes=AU` parameter)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user types a valid Australian city name (e.g., "Sydney", "Melbourne", "Brisbane") THEN the system SHALL CONTINUE TO return matching autocomplete results

3.2 WHEN a user selects an Australian location from the autocomplete THEN the system SHALL CONTINUE TO pass the city name to the search page via the `city` URL parameter

3.3 WHEN the geocode API receives a query shorter than 2 characters THEN the system SHALL CONTINUE TO return an empty features array without calling the upstream service

3.4 WHEN the upstream Photon geocoding service is unavailable THEN the system SHALL CONTINUE TO return a 502 error with an appropriate error message
