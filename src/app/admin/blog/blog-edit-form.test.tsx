// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { BlogEditForm } from "./blog-edit-form";
import type { AdminBlogArticleDetail } from "@/lib/blog/queries";
import type { UpdateBlogArticleState } from "./actions";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const updateBlogArticle = vi.fn<
  (articleId: string, prevState: UpdateBlogArticleState, formData: FormData) => Promise<UpdateBlogArticleState>
>(async () => ({ success: true }));

vi.mock("./actions", () => ({
  updateBlogArticle: (
    articleId: string,
    prevState: UpdateBlogArticleState,
    formData: FormData,
  ) => updateBlogArticle(articleId, prevState, formData),
}));

const article: AdminBlogArticleDetail = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Original Title",
  slug: "original-title",
  excerpt: "Original excerpt",
  body: "<p>Original body</p>",
  status: "published",
  source: "auto_bot",
  category_id: "22222222-2222-2222-2222-222222222222",
  featured_image_url: "https://example.supabase.co/image.jpg",
  featured_image_alt: "Alt text",
  meta_title: "Meta title",
  meta_description: "Meta description",
  reading_time_minutes: 3,
  published_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  tags: ["perth", "suv"],
};

const categories = [
  { id: "22222222-2222-2222-2222-222222222222", name: "City Guides", slug: "city-guides" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Vehicle Reviews", slug: "vehicle-reviews" },
];

function getForm(): HTMLFormElement {
  const form = document.querySelector("form");
  if (!form) throw new Error("form not found");
  return form;
}

describe("BlogEditForm", () => {
  it("prefills every field from the existing article", () => {
    render(<BlogEditForm article={article} categories={categories} cancelHref="/admin/blog" />);

    const value = (label: string) =>
      (screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
        .value;

    expect(value("Title")).toBe("Original Title");
    expect(value("Slug")).toBe("original-title");
    expect(value("Status")).toBe("published");
    expect(value("Category")).toBe(article.category_id);
    expect(value("Excerpt")).toBe("Original excerpt");
    expect(value("Body (HTML)")).toBe("<p>Original body</p>");
    expect(value("Featured Image URL")).toBe("https://example.supabase.co/image.jpg");
    expect(value("Featured Image Alt Text")).toBe("Alt text");
    expect(value("Meta Title")).toBe("Meta title");
    expect(value("Meta Description")).toBe("Meta description");
    expect(value("Tags (comma-separated)")).toBe("perth, suv");
  });

  it("renders empty selects/inputs safely when optional fields are null", () => {
    const draft: AdminBlogArticleDetail = {
      ...article,
      category_id: null,
      featured_image_url: null,
      featured_image_alt: null,
      meta_title: null,
      meta_description: null,
      tags: [],
    };

    render(<BlogEditForm article={draft} categories={categories} cancelHref="/admin/blog" />);

    const value = (label: string) =>
      (screen.getByLabelText(label) as HTMLInputElement | HTMLSelectElement).value;

    expect(value("Category")).toBe("");
    expect(value("Featured Image URL")).toBe("");
    expect(value("Tags (comma-separated)")).toBe("");
  });

  it("submits the article id bound via .bind() plus edited FormData values", async () => {
    render(<BlogEditForm article={article} categories={categories} cancelHref="/admin/blog" />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated Title" },
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "draft" },
    });
    fireEvent.change(screen.getByLabelText("Tags (comma-separated)"), {
      target: { value: "perth, suv, family" },
    });

    fireEvent.submit(getForm());

    await waitFor(() => expect(updateBlogArticle).toHaveBeenCalledTimes(1));

    const [boundArticleId, , formData] = updateBlogArticle.mock.calls[0];

    expect(boundArticleId).toBe(article.id);
    expect(formData.get("title")).toBe("Updated Title");
    expect(formData.get("status")).toBe("draft");
    expect(formData.get("slug")).toBe("original-title");
    expect(formData.get("tags")).toBe("perth, suv, family");
    expect(formData.get("categoryId")).toBe(article.category_id);
  });

  it("shows the server-returned field errors", async () => {
    updateBlogArticle.mockResolvedValueOnce({
      success: false,
      error: "Validation failed. Please fix the highlighted fields.",
      fieldErrors: { title: ["Title must be at least 3 characters"] },
    });

    render(<BlogEditForm article={article} categories={categories} cancelHref="/admin/blog" />);

    fireEvent.submit(getForm());

    expect(
      await screen.findByText("Title must be at least 3 characters"),
    ).not.toBeNull();
  });
});
