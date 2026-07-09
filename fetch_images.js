async function fetchImage(city) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(city)}&prop=pageimages&format=json&pithumbsize=400`;
  const res = await fetch(url);
  const data = await res.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  console.log(city, pages[pageId].thumbnail ? pages[pageId].thumbnail.source : 'No image');
}
fetchImage('Gold Coast, Queensland');
