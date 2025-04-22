function getLinks(container, stringFilter, extensionFilter) {
  const results = []
  for (const b of container.children) {
    const item = b.getElementsByTagName('a')[0];
    if (item.text.includes(stringFilter) && item.text.endsWith(extensionFilter)) {
      results.push(item.href);
    }
  }
  return results;
}