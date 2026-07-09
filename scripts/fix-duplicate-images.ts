import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createAdminClient } from "../src/lib/supabase/admin";
import { resolveBlogFeaturedImage } from "../src/lib/ai/blog-image";

async function main() {
  const supabase = createAdminClient();
  const { data: articles, error } = await supabase
    .from("blog_articles")
    .select("id, slug, title, primary_keyword, featured_image_alt, featured_image_url")
    .order("published_at", { ascending: true });

  if (error || !articles) {
    console.error("Failed to fetch articles:", error);
    process.exit(1);
  }

  const articlesToUpdate = articles;

  console.log(`Updating images for all ${articlesToUpdate.length} articles.`);

  let updatedCount = 0;
  
  for (const article of articlesToUpdate) {

    console.log(`Fetching new image for: ${article.title} (${article.slug})`);
    
    const query = article.primary_keyword ? `${article.primary_keyword} Australia car` : `${article.title} Australia`;
    
    const newImage = await resolveBlogFeaturedImage({
      slug: article.slug,
      imagePrompt: "", 
      alt: article.featured_image_alt || article.title,
      searchQuery: query
    });

    if (newImage && newImage.url !== article.featured_image_url) {
      const { error: updateError } = await supabase
        .from("blog_articles")
        .update({
          featured_image_url: newImage.url,
          featured_image_alt: newImage.alt
        })
        .eq("id", article.id);

      if (updateError) {
        console.error(`Failed to update ${article.slug}:`, updateError);
      } else {
        console.log(`Successfully updated ${article.slug}`);
        updatedCount++;
      }
    } else {
      console.log(`Could not find a unique new image for ${article.slug}`);
    }
    
    // Slight delay for Unsplash rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nFinished! Updated ${updatedCount} articles.`);
}

main().catch(console.error);
