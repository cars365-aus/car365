# Requirements Document

## Introduction

The Blog/Content Hub is an SEO-driven content marketing section for HireCar Marketplace. It captures long-tail keyword traffic (road trip guides, car rental tips, city guides), builds topical authority in the Australian car hire space, and provides strategic internal linking to existing programmatic SEO pages (locations, categories, vehicle listings). The feature supports admin-authored content and vendor guest contributions, with a full editorial workflow and structured data for search visibility.

## Glossary

- **Content_Hub**: The public-facing blog section of HireCar Marketplace accessible at `/blog`, serving as the top-level index for all published articles.
- **Article**: A single blog post containing structured content (title, body, metadata, images) stored in the database and rendered as a public page.
- **Author**: A registered user (admin or vendor) who creates Article content within the Content_Hub.
- **Category**: A topic-based classification for articles (e.g., "Road Trip Guides", "Car Rental Tips", "City Guides", "Vendor Spotlights").
- **Tag**: A keyword-level label applied to articles for granular content grouping and filtering.
- **Editorial_Workflow**: The process by which articles move through draft, review, and published states before appearing on the public site.
- **Content_Editor**: The admin interface for creating, editing, and managing Article content with rich text formatting.
- **Internal_Link**: A hyperlink within Article content that points to an existing HireCar page (location, category, vehicle, or vendor page).
- **Featured_Image**: The primary image associated with an Article, used in listings, social sharing, and structured data.
- **Reading_Time**: An estimated time to read an Article, calculated from word count.
- **Related_Articles**: A set of contextually relevant articles displayed alongside or below the current Article.
- **Vendor_Contributor**: A vendor user who has been granted permission to submit guest articles for review.
- **CMS**: Content Management System — the admin-facing interface for managing all Content_Hub content.
- **Slug**: A URL-friendly identifier derived from the Article title, used in the public URL path.

## Requirements

### Requirement 1: Article Data Model and Storage

**User Story:** As an admin, I want articles stored with structured metadata, so that content is organized, searchable, and renderable with rich SEO attributes.

#### Acceptance Criteria

1. THE Content_Hub SHALL store each Article with: title (max 150 characters), slug (max 180 characters), body (rich text), excerpt (max 300 characters), featured_image_url, author_id, category_id, status, published_at, created_at, updated_at, meta_title (max 70 characters), meta_description (max 160 characters), and reading_time_minutes (integer, minimum 1).
2. WHEN an Article is created, THE Content_Hub SHALL generate a slug from the Article title containing only lowercase alphanumeric characters and hyphens, with leading/trailing hyphens removed and consecutive hyphens collapsed to a single hyphen.
3. IF a generated or provided slug already exists in the system, THEN THE Content_Hub SHALL reject the article creation and return an error indicating the slug conflict.
4. WHEN an Article body is saved, THE Content_Hub SHALL calculate reading_time_minutes by dividing the total word count by 200 and rounding up to the nearest integer, with a minimum value of 1.
5. THE Content_Hub SHALL support articles in the following statuses: draft, in_review, published, and archived.
6. WHEN an Article is created without an explicit status, THE Content_Hub SHALL assign the default status of draft.

### Requirement 2: Article Publishing and Editorial Workflow

**User Story:** As an admin, I want a clear editorial workflow, so that content quality is maintained before articles become publicly visible.

#### Acceptance Criteria

1. WHEN an Article status is set to "published" and published_at is null, THE Editorial_Workflow SHALL set published_at to the current timestamp.
2. WHILE an Article status is "draft" or "in_review", THE Content_Hub SHALL prevent public access to that Article and return a 404 response at its public URL.
3. WHEN an admin changes an Article status from "in_review" to "published", THE Content_Hub SHALL make the Article accessible at its public URL within 60 seconds.
4. WHEN an admin changes an Article status to "archived", THE Content_Hub SHALL remove the Article from public listings and return a 410 Gone response at its URL.
5. WHEN an admin sets published_at to a future timestamp on an Article with status "draft" or "in_review", THE Editorial_Workflow SHALL accept the scheduled time and retain the Article's current status until the scheduled time arrives.
6. WHEN the current time passes a scheduled published_at timestamp, THE Content_Hub SHALL set the Article status to "published" and make it publicly accessible within 120 seconds of the scheduled time.
7. IF an admin changes a scheduled Article's status to "archived" or clears its published_at before the scheduled time, THEN THE Editorial_Workflow SHALL cancel the scheduled publication and the Article SHALL NOT become publicly accessible at the previously scheduled time.
8. THE Editorial_Workflow SHALL restrict status transitions to the following paths: "draft" to "in_review", "in_review" to "published", "in_review" to "draft", "published" to "archived", and "archived" to "draft".

### Requirement 3: Content Editor Interface

**User Story:** As an admin, I want a rich text editor for writing articles, so that I can format content with headings, images, links, and embedded media without writing raw HTML.

#### Acceptance Criteria

1. THE Content_Editor SHALL support the following formatting: headings (H2–H4), bold, italic, bulleted lists, numbered lists, blockquotes, inline code, and horizontal rules.
2. THE Content_Editor SHALL support inserting images with alt text (maximum 125 characters), optional caption (maximum 200 characters), accepted formats limited to JPEG, PNG, WebP, and GIF, and a maximum file size of 5 MB per image.
3. THE Content_Editor SHALL support inserting hyperlinks with configurable URL (maximum 2048 characters), display text (maximum 200 characters), and open-in-new-tab option.
4. THE Content_Editor SHALL provide a live preview of the rendered Article that updates within 500 milliseconds of the last input change, displayed side-by-side with the editing interface on viewports 1024px and above, and accessible via a toggle button on viewports below 1024px.
5. WHILE the admin is editing an Article, THE Content_Editor SHALL auto-save the Article draft every 30 seconds and display a visible status indicator showing the last successful save timestamp.
6. THE Content_Editor SHALL allow admins to edit the meta_title field (maximum 60 characters) and meta_description field (maximum 160 characters) for SEO customisation, with a visible character count displayed for each field.
7. IF an auto-save operation fails, THEN THE Content_Editor SHALL display an error indicator informing the admin that unsaved changes exist and provide a manual "Save Now" button to retry the save operation without discarding current editor content.
8. THE Content_Editor SHALL support embedding media by URL (YouTube and Vimeo video links) and render an embedded player preview within the editor preview pane.
9. IF an image upload fails due to exceeding the maximum file size or using an unsupported format, THEN THE Content_Editor SHALL display an error message indicating the specific validation failure and SHALL NOT discard the surrounding article content.

### Requirement 4: Category and Tag Management

**User Story:** As an admin, I want to organize articles into categories and tags, so that readers can browse content by topic and the site builds topical authority clusters.

#### Acceptance Criteria

1. THE Content_Hub SHALL support assigning exactly one Category to each Article, and SHALL require a Category to be assigned before an Article can be published.
2. THE Content_Hub SHALL support assigning zero to 10 Tags to each Article.
3. WHEN a Category is created, THE Content_Hub SHALL generate a slug containing only lowercase alphanumeric characters and hyphens (no consecutive hyphens, no leading/trailing hyphens, between 3 and 60 characters) and create a public index page at `/blog/category/[slug]`.
4. WHEN a Tag is created, THE Content_Hub SHALL generate a slug containing only lowercase alphanumeric characters and hyphens (no consecutive hyphens, no leading/trailing hyphens, between 3 and 60 characters) and create a public index page at `/blog/tag/[slug]`.
5. THE Content_Hub SHALL display Category and Tag index pages with paginated lists of published articles sorted by publish date descending, showing 10 articles per page.
6. THE Content_Hub SHALL allow admins to create, rename, and archive Categories and Tags through the CMS, where names must be unique within their type (Category or Tag) and between 2 and 50 characters in length.
7. IF a Category is archived, THEN THE Content_Hub SHALL prevent new articles from being assigned to it and SHALL continue to display previously published articles under that Category on the index page until they are reassigned.
8. IF an admin attempts to create a Category or Tag with a name that already exists within the same type, THEN THE Content_Hub SHALL reject the creation and display an error message indicating the name is already in use.

### Requirement 5: Public Blog Pages and Navigation

**User Story:** As a site visitor, I want to browse, search, and read blog articles, so that I can find helpful car hire and travel information.

#### Acceptance Criteria

1. THE Content_Hub SHALL render a public index page at `/blog` displaying published articles sorted by published_at descending, where each article listing shows the Featured_Image, title, excerpt (maximum 160 characters), Author name, published date, Reading_Time, and Category label.
2. THE Content_Hub SHALL paginate the blog index with a maximum of 12 articles per page and display pagination controls showing the current page number, total page count, a previous-page button, and a next-page button, where previous is disabled on page 1 and next is disabled on the last page.
3. THE Content_Hub SHALL render each published Article at `/blog/[slug]` with formatted body content, Featured_Image, Author byline, published date, Reading_Time, Category link, and Tag links.
4. THE Content_Hub SHALL display a Related_Articles section below each Article showing up to 3 published articles from the same Category, sorted by published_at descending, excluding the current Article. IF fewer than 1 published article exists in the same Category, THEN THE Content_Hub SHALL hide the Related_Articles section entirely.
5. THE Content_Hub SHALL include a search input on the blog index that filters articles by title and content using Typesense, where the search executes after the visitor has entered at least 2 characters and results replace the default paginated listing in-place within 500 milliseconds of the query being sent.
6. IF the blog search returns zero results, THEN THE Content_Hub SHALL display a message indicating no articles matched the query and a suggestion to try different keywords.
7. WHEN a visitor navigates to a non-existent blog slug, THE Content_Hub SHALL return a 404 response with a page displaying a message indicating the article was not found, a link to the blog index at `/blog`, and a link to the site home page.
8. IF the Typesense search service is unavailable, THEN THE Content_Hub SHALL hide the search input and continue to display the default paginated article listing without error.

### Requirement 6: SEO Optimisation and Structured Data

**User Story:** As a marketing manager, I want blog pages to have complete SEO metadata and structured data, so that articles rank well in search engines and appear in rich results.

#### Acceptance Criteria

1. THE Content_Hub SHALL generate a `<title>` tag using meta_title if set, otherwise falling back to "[Article Title] | HireCar Blog", truncated to a maximum of 60 characters.
2. THE Content_Hub SHALL generate a `<meta name="description">` tag using meta_description if set, otherwise falling back to the Article excerpt, truncated to a maximum of 155 characters.
3. THE Content_Hub SHALL inject JSON-LD structured data of type `Article` (schema.org) on each Article page, including headline, datePublished, dateModified, author name, image URL, and publisher name with logo URL.
4. IF an Article has no assigned category, THEN THE Content_Hub SHALL render the BreadcrumbList JSON-LD with the path: Home → Blog → Article, omitting the Category level.
5. THE Content_Hub SHALL inject JSON-LD structured data of type `BreadcrumbList` on each Article page with the path: Home → Blog → Category → Article when the Article has an assigned category.
6. THE Content_Hub SHALL set a canonical URL on each Article page pointing to `https://www.hirecar.com.au/blog/[slug]`.
7. THE Content_Hub SHALL include blog URLs in the site XML sitemap, emitting only published articles, with each entry including the `<loc>` and `<lastmod>` (set to the article's dateModified) elements.
8. THE Content_Hub SHALL generate OpenGraph meta tags (og:title, og:description, og:image, og:url, og:type set to "article") and Twitter Card meta tags (twitter:card set to "summary_large_image", twitter:title, twitter:description, twitter:image) for each Article.
9. IF an Article has no Featured_Image set, THEN THE Content_Hub SHALL use the site default OG image as the value for og:image and twitter:image meta tags.

### Requirement 7: Internal Linking Strategy

**User Story:** As a marketing manager, I want articles to link to existing location and category pages, so that the blog strengthens the SEO authority of the marketplace's core pages.

#### Acceptance Criteria

1. THE Content_Editor SHALL provide an "Insert Internal Link" feature that presents a searchable list of existing HireCar pages (locations, categories, vehicles, vendors), displaying up to 10 results per search query and filtering results as the user types with a minimum of 2 characters.
2. WHEN an Internal_Link is inserted, THE Content_Editor SHALL use the canonical URL path for the selected page and open the link in the same browser tab.
3. WHEN an Article page is rendered, THE Content_Hub SHALL display a contextual sidebar or footer widget containing links to up to 5 location pages whose city names appear as exact case-insensitive matches within the Article body content.
4. THE Content_Hub SHALL render Category index pages with links to corresponding marketplace category pages where the blog category slug maps directly to the marketplace category slug (e.g., `/blog/category/suv-guides` links to `/categories/suv`).
5. WHEN an Article mentions a city name that matches an existing location page via exact case-insensitive string comparison, THE Content_Hub SHALL auto-suggest adding an Internal_Link to that location page during editing, presenting each matched city once regardless of how many times it appears in the Article.
6. IF an Internal_Link references a page that has been unpublished or deleted, THEN THE Content_Hub SHALL omit that link from the rendered sidebar widget and Category index pages, and THE Content_Editor SHALL display a visual indicator on the broken link within the editor.
7. IF no matching location pages are found for cities mentioned in an Article, THEN THE Content_Hub SHALL hide the contextual sidebar or footer widget entirely rather than rendering an empty widget.

### Requirement 8: Vendor Guest Contributions

**User Story:** As a vendor, I want to submit guest blog articles about my city or region, so that I can promote my business and share local expertise.

#### Acceptance Criteria

1. WHILE a vendor has an approved organization and an active subscription, THE Content_Hub SHALL allow that Vendor_Contributor to access a guest post submission form requiring a title (between 10 and 150 characters), body content (between 300 and 5000 words), and at least one region tag.
2. WHEN a Vendor_Contributor submits an article, THE Editorial_Workflow SHALL set the Article status to "in_review" and notify all users with the admin role via email within 5 minutes of submission.
3. WHEN a vendor guest article status is changed to "published", THE Content_Hub SHALL attribute the article to the Vendor_Contributor with a linked author byline pointing to their vendor page.
4. THE Content_Hub SHALL limit Vendor_Contributors to a maximum of 2 article submissions per calendar month, where the count resets at midnight UTC on the first day of each month.
5. IF a Vendor_Contributor attempts to submit an article after reaching the monthly limit of 2, THEN THE Content_Hub SHALL reject the submission, retain the entered content in the form, and display an error message indicating the monthly limit has been reached along with the date the limit resets.
6. WHEN an admin rejects a vendor submission, THE Content_Hub SHALL notify the Vendor_Contributor via email with the rejection reason (minimum 20 characters provided by the admin).
7. THE Content_Hub SHALL prevent Vendor_Contributors from editing articles after submission; only admins may edit submitted content.
8. IF a Vendor_Contributor's subscription lapses or organization approval is revoked while an article is in "in_review" status, THEN THE Editorial_Workflow SHALL retain the article in "in_review" status and notify the admin that the contributor's eligibility has changed.

### Requirement 9: Performance and Caching

**User Story:** As a site visitor, I want blog pages to load quickly, so that I have a smooth reading experience.

#### Acceptance Criteria

1. THE Content_Hub SHALL render Article pages using static generation with ISR (revalidate period of 3600 seconds).
2. WHEN an Article is published or updated, THE Content_Hub SHALL trigger on-demand ISR revalidation for the affected Article page, the blog index, the relevant Category index page, and any associated Tag index pages.
3. THE Content_Hub SHALL render Featured_Images using Next.js Image component with explicit width and height attributes, responsive srcset covering at minimum 640px, 768px, 1024px, and 1280px widths, lazy loading for below-fold images, and priority (eager) loading for the Featured_Image when it appears above the fold on the Article page.
4. THE Content_Hub SHALL achieve a Largest Contentful Paint (LCP) below 2.5 seconds on Article pages when measured using Lighthouse with simulated mobile throttling (Moto G Power on a 4G connection).
5. IF on-demand ISR revalidation fails, THEN THE Content_Hub SHALL continue serving the previously cached version of the affected pages and log the revalidation failure for administrative review.

### Requirement 10: Access Control and Security

**User Story:** As an admin, I want blog management restricted to authorised users, so that only approved content appears on the site.

#### Acceptance Criteria

1. THE CMS SHALL restrict article creation, editing, and status changes to authenticated users with admin or vendor_contributor roles, and SHALL reject any such request from a user without the required role by returning an access-denied indication without performing the requested operation.
2. THE CMS SHALL restrict Category and Tag management (creation, editing, and deletion) to authenticated users with the admin role, and SHALL reject any such request from a non-admin authenticated user by returning an access-denied indication without performing the requested operation.
3. WHEN an unauthenticated user attempts to access any CMS content-management route (article, category, or tag creation, editing, or listing pages), THE Content_Hub SHALL redirect the user to the login page with a parameter preserving the originally requested path.
4. THE Content_Hub SHALL apply Row Level Security policies on blog database tables ensuring vendors can only read, update, and delete their own draft submissions, and SHALL prevent vendors from modifying or deleting any article that has been published or is owned by another user.
5. IF a vendor account is suspended, THEN THE Content_Hub SHALL prevent that vendor from submitting new articles, prevent that vendor from editing existing articles, and exclude all of that vendor's published articles from public listing pages and direct URL access, returning a not-found response for those articles.
6. IF an authenticated user with the vendor_contributor role attempts to change an article's status to published, THEN THE Content_Hub SHALL reject the request and return an indication that only admin users may publish articles.
7. IF a suspended vendor's account is reactivated, THEN THE Content_Hub SHALL restore that vendor's previously published articles to public visibility within 60 seconds of reactivation without requiring manual republishing.
