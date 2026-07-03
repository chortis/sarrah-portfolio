# How to Add Portfolio Content (ELI5) with Copilot + Cloudinary

## 1) Open the right account
1. Open Google Chrome.
2. Switch to **Curtis’s profile**.
3. Go to **https://github.com/chortis**.
4. Confirm **chortis** is signed in.

## 2a) Your own boards/images
1. Go to **cloudinary.com**.
2. Sign in with **GitHub**.
3. Click **Upload** (top right).
4. Upload your image/video to **Assets**.

## 2b) YouTube link
1. Open your YouTube video.
2. Copy the video link.
3. Collect timestamps if needed.

## 3) Add content with Copilot
1. Go to **https://github.com/chortis/sarrah-portfolio**.
2. Click **Chat with Copilot** (top right).
3. Paste this prompt:

```text
Add a new portfolio item using this data:

Title: [your title]
Description: [your description]
URL: [Cloudinary secure video/image URL]
Timestamp links: [YOUTUBE ONLY TIMESTAMPS, don't add this if its just a regular board or image]
Thumbnail timestamp: [add timestamp for thumbnail - like 00:00:03]
Password protected: [yes/no]
```

## 4) Have Copilot merge it
After Copilot creates the PR, say:

**merge to main**

(If branch protections are enabled on main, GitHub may still require checks/reviews before merge.)
