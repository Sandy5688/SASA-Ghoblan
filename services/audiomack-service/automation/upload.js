export const uploadTrack = async (page, filePath, metadata) => {
  try {
    await page.goto("https://audiomack.com/upload");

    // Upload audio file
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.click("button:has-text('Select File')")
    ]);
    await fileChooser.setFiles(filePath);

    // Fill metadata
    await page.fill('input[name="title"]', metadata.title?.en || "Untitled");
    await page.fill('textarea[name="description"]', metadata.description?.en || "");

    if (metadata.tags?.en) {
      await page.fill('input[name="tags"]', metadata.tags.en.join(", "));
    }

    await page.click("button:has-text('Upload')");
    await page.waitForTimeout(5000); // wait for processing

    return "ok";
  } catch (err) {
    console.error("Upload failed:", err.message);
    return "error";
  }
};
